const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const main = read('src/app/core/main.js');
const declarations = [...main.matchAll(/^        (?:async )?function (\w+)\(/gm)];
function productionFunction(name) {
    const index = declarations.findIndex(match => match[1] === name);
    assert.notEqual(index, -1, name);
    return main.slice(declarations[index].index, declarations[index + 1]?.index ?? main.length);
}
function context(extra = {}) {
    const result = { console: { log() {}, warn() {}, error() {} }, URL, URLSearchParams, ...extra };
    result.window ||= result;
    return vm.createContext(result);
}

test('text sanitizer escapes markup and both quote styles used in attributes', () => {
    const c = context();
    vm.runInContext(read('src/utils/sanitizer.js'), c);
    assert.equal(c.Sanitizer.sanitizeText('" onfocus="alert(1)\'><img src=x onerror=alert(1)> &'),
        '&quot; onfocus=&quot;alert(1)&#39;&gt;&lt;img src=x onerror=alert(1)&gt; &amp;');
});

test('sanitizer diagnostic log does not retain user-supplied payloads', () => {
    const c = context();
    vm.runInContext(read('src/utils/sanitizer.js'), c);
    c.Sanitizer.sanitizeEmail('private-email-secret');
    assert(!JSON.stringify(c.Sanitizer.getAttackLogs()).includes('private-email-secret'));
});

test('object sanitizer cannot assign prototype keys', () => {
    const c = context();
    vm.runInContext(read('src/utils/sanitizer.js'), c);
    const value = c.Sanitizer.sanitizeObject(JSON.parse('{"__proto__":{"polluted":true},"name":"normal"}'));
    assert.equal(value.name, 'normal');
    assert.equal(Object.prototype.hasOwnProperty.call(value, '__proto__'), false);
});

test('inline history identifiers preserve apostrophes without breaking JavaScript attributes', () => {
    const c = context();
    vm.runInContext(productionFunction('toHistoryInlineArg'), c);
    const value = "id');alert(1);//";
    const encoded = c.toHistoryInlineArg(value);
    assert(!encoded.includes("'"));
    assert.equal(decodeURIComponent(encoded), value);
});

test('screenshots retain full image data and block attribute injection and SVG payloads', () => {
    const c = context();
    vm.runInContext(productionFunction('normalizeHistoryCaptureSrc') + productionFunction('safeCaptureAttribute'), c);
    const base64 = 'A'.repeat(16000);
    assert.equal(c.safeCaptureAttribute(base64), 'data:image/jpeg;base64,' + base64);
    assert.equal(c.safeCaptureAttribute('data:image/svg+xml,<svg onload=alert(1)>'), '');
    assert.equal(c.safeCaptureAttribute('AAAA" onerror="alert(1)'), '');
    assert.equal(c.safeCaptureAttribute('https://name:password@example.invalid/pic.png'), '');
});

test('production cannot enable test captcha by URL or local storage', () => {
    for (const hostname of ['sswintelligence.com.br', 'preview.pages.dev']) {
        const c = context({ location: { hostname, protocol: 'https:', search: '?demoTest=1' }, localStorage: { getItem: () => '1' } });
        vm.runInContext(productionFunction('isLocalTestMode'), c);
        assert.equal(c.isLocalTestMode(), false);
    }
    const c = context({ location: { hostname: 'localhost', protocol: 'http:', search: '' } });
    vm.runInContext(productionFunction('isLocalTestMode'), c);
    assert.equal(c.isLocalTestMode(), true);
});

test('technical HTTP details cannot become public UI messages', () => {
    const c = context();
    vm.runInContext(read('src/utils/errors.js'), c);
    for (const status of [400, 401, 403, 404, 405, 408, 429, 500, 502, 503]) {
        const text = c.publicErrorMessage('SQL SELECT password FROM users; /private/server.py token=secret', 'Tente novamente.', status);
        assert(!text.includes('SQL'));
        assert(!text.includes('secret'));
        assert(text.length > 0);
    }
});

test('audit errors are translated locally while retaining anti-bot recovery guidance', () => {
    const c = context();
    vm.runInContext(read('src/utils/errors.js'), c);
    for (const name of ['getAuditErrorPayload', 'getAuditErrorDetailText', 'getAuditErrorStage', 'isAntiBotAuditError', 'formatAuditApiError']) {
        vm.runInContext(productionFunction(name), c);
    }
    assert(!c.formatAuditApiError('SELECT secret FROM users /srv/app.py', 400).includes('secret'));
    assert(c.formatAuditApiError('Cloudflare challenge', 400).includes('libere'));
    assert(c.formatAuditApiError('Captcha inválido.', 403).includes('verificação'));
});

test('diagnostics preserve native error reporting and contain no raw error payloads', () => {
    const handlers = {};
    const c = context({ addEventListener: (name, callback) => { handlers[name] = callback; } });
    const originalError = c.console.error;
    vm.runInContext(read('src/app/ui/console-cleaner.js'), c);
    let prevented = false;
    handlers.error({ message: 'secret', preventDefault: () => { prevented = true; } });
    handlers.unhandledrejection({ reason: new Error('private'), preventDefault: () => { prevented = true; } });
    assert.equal(c.console.error, originalError);
    assert.equal(prevented, false);
    assert(!JSON.stringify(c.SSWConsole.dump()).includes('secret'));
    assert(!JSON.stringify(c.SSWConsole.dump()).includes('private'));
});

test('Toast puts untrusted notifications in textContent and announces errors', () => {
    const children = [];
    const message = { textContent: '' };
    const attributes = {};
    const toast = { classList: { add() {} }, setAttribute: (key, value) => { attributes[key] = value; },
        querySelector: selector => selector === 'p' ? message : { addEventListener() {} } };
    const c = context({ document: { getElementById: () => ({ appendChild: node => children.push(node) }), createElement: () => toast }, setTimeout() {} });
    vm.runInContext(read('src/app/ui/toast.js'), c);
    vm.runInContext('Toast.error("<img src=x onerror=alert(1)>")', c);
    assert.equal(message.textContent, '<img src=x onerror=alert(1)>');
    assert(!toast.innerHTML.includes('onerror'));
    assert.equal(attributes.role, 'alert');
    assert.equal(children.length, 1);
});

test('missing ranking metrics remain missing rather than synthesized from the overall score', () => {
    const source = read('src/components/ranking/ranking-component.js');
    const start = source.indexOf('function metricValue(');
    const end = source.indexOf('function siteName(', start);
    const c = context();
    vm.runInContext(source.slice(start, end), c);
    assert.equal(c.metricValue({ score: 80 }, ['seo'], 2), '--');
    assert.equal(c.metricValue({ score: 80, seo: null }, ['seo'], 2), '--');
    assert.equal(c.metricValue({ seo: 0 }, ['seo']), 0);
    assert.equal(c.metricValue({ seo: 83 }, ['seo']), 83);
});

test('payment errors neither read nor display the raw response body', async () => {
    let bodyRead = false;
    const c = context({ ENV: { VITE_MP_PUBLIC_KEY: 'TEST-public' }, fetch: async () => ({ ok: false, status: 503, text: async () => { bodyRead = true; return 'private SQL'; } }) });
    vm.runInContext(read('src/utils/errors.js'), c);
    vm.runInContext(read('src/app/payments/mercado-pago-checkout.js'), c);
    const payment = c.checkoutMP;
    const messages = [];
    payment.selectedPackage = { id: 'recarga_10' };
    payment.currentUser = { email: 'test@example.invalid', token: 'test-token' };
    payment.showState = () => {};
    payment.getCheckoutCaptchaToken = () => 'test-captcha';
    payment.resetCheckoutTurnstile = () => {};
    payment.showError = message => messages.push(message);
    await payment.handlePaymentSubmit({ payment_method_id: 'pix' });
    assert.equal(bodyRead, false);
    assert.equal(messages.length, 1);
    assert(!messages[0].includes('SQL'));
    assert(messages[0].includes('temporariamente'));
});

test('legacy audit fallback never generates a report or consumes credits', async () => {
    const calls = [];
    const c = context({ cancelAuditDueToApiError: value => calls.push(value) });
    vm.runInContext(productionFunction('generateFallbackAudit'), c);
    await c.generateFallbackAudit('https://example.invalid', 'manual', []);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].mode, 'manual');
    assert(calls[0].displayMessage.includes('Nenhum relatório'));
});
