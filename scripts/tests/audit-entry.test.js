const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(projectRoot, 'src/app/core/main.js'), 'utf8');
const declarations = [...source.matchAll(/^        (?:async )?function (\w+)\(/gm)];

// Exercise the shipped functions without loading network services or the full app.
function extractFunction(name) {
    const index = declarations.findIndex(match => match[1] === name);
    assert.notEqual(index, -1, `Missing production function: ${name}`);
    return source.slice(declarations[index].index, declarations[index + 1]?.index ?? source.length);
}

function createHarness({ height = 720, authenticated = true, standalone = true } = {}) {
    const frames = [];
    const requests = [];
    const events = [];
    const nodes = new Map();
    const makeNode = (id, classes = []) => {
        const tokens = new Set(classes);
        const node = {
            id,
            style: {},
            value: '',
            checked: false,
            classList: {
                contains: name => tokens.has(name),
                add: (...names) => names.forEach(name => tokens.add(name)),
                remove: (...names) => names.forEach(name => tokens.delete(name)),
                toggle(name, force = !tokens.has(name)) {
                    if (force) tokens.add(name);
                    else tokens.delete(name);
                    return force;
                }
            },
            focus: () => { document.activeElement = node; },
            scrollTo() {},
            scrollIntoView() {},
            remove: () => nodes.delete(id)
        };
        nodes.set(id, node);
        return node;
    };
    const home = makeNode('view-home');
    const hero = makeNode('heroSection', ['hidden']);
    const input = standalone ? makeNode('landing-analysis') : hero;
    const manual = makeNode('manualSelectArea', ['hidden']);
    const loading = makeNode('auditLoading', ['hidden']);
    const results = makeNode('auditResults', ['hidden']);
    const main = makeNode('mainContent', ['overflow-y-auto']);
    const search = makeNode('search-container');
    const marketing = [hero, makeNode('marketing-section')];
    ['homeFooterSpacer', 'guestLandingActions', 'normalSearchBar', 'compareSearchBar',
        'turnstile-audit', 'turnstile-compare', 'compareArea', 'emptyStateCards', 'auditUrl', 'auditMode']
        .forEach(id => makeNode(id));
    nodes.get('auditMode').value = 'auto';
    nodes.get('auditUrl').value = 'https://example.invalid/';
    const radios = ['auto', 'manual'].map(value => Object.assign(makeNode(`radio-${value}`), {
        value, checked: value === 'auto'
    }));
    const document = {
        body: makeNode('body', authenticated ? ['user-authenticated'] : []),
        documentElement: makeNode('html'),
        activeElement: null,
        getElementById: id => nodes.get(id) ?? null,
        querySelector: selector => selector === '.search-container' ? search
            : selector === 'input[name="auditMode"][value="auto"]' ? radios[0] : null,
        querySelectorAll: selector => selector.includes('lp-editorial') ? marketing
            : selector === 'input[name="auditMode"]' ? radios
                : selector === '.agent-radio:checked' ? [{ value: 'persona-example' }] : []
    };
    const noop = () => {};
    const context = {
        document,
        USER: authenticated ? { email: 'test@example.invalid', credits: 2 } : null,
        API_URL: 'https://api.example.invalid',
        console: { log: noop, error: noop },
        Toast: { warning: message => events.push(['warning', message]) },
        setTimeout: callback => { callback(); return 1; },
        requestAnimationFrame: callback => { frames.push(callback); return frames.length; },
        sanitizeUrlInputValue: node => node.value,
        bloquearUrlLocalSeNecessario: () => false,
        getAuditCaptchaToken: () => 'test-captcha',
        getLocalTestCaptchaToken: () => '',
        authHeaders: headers => headers,
        fetch: async (url, options) => {
            requests.push({ url, options });
            return { ok: false, status: 402 };
        },
        hideAuditLoading: () => loading.classList.add('hidden'),
        resetAuditCaptcha: () => events.push(['reset-captcha']),
        showCreditsEndedModal: () => events.push(['credits-ended']),
        cancelAuditDueToApiError: details => { throw new Error(`Unexpected audit error: ${details.reason}`); }
    };
    for (const name of ['positionLocalAuditHelp', 'setModeOnlyCardsVisibility', 'updateUserMenuCircle',
        'setDemoAuditMode', 'setDemoAuditOutputState', 'showAuthScreen', 'hideHistorySurfaces',
        'hideAuditChatSurfaces', 'setActiveNavButton', 'validateManualPersonaNiche', 'startAuditLoadingAnimation']) {
        context[name] = noop;
    }
    context.window = {
        currentView: 'home',
        innerHeight: height,
        location: { pathname: '/home' },
        history: { pushState: noop },
        scrollTo: noop,
        requestAnimationFrame: context.requestAnimationFrame
    };
    vm.createContext(context);
    const functions = ['getAuditInputSection', 'setHomePresentationVisible', 'setAnalysisFocusState',
        'syncAuditWorkspaceLayout', 'setAnalysisModeState', 'showHomeLandingState',
        'showHomeAnalysisState', 'showOnlyAuditHomeView', 'showSimplifiedSearch',
        'restoreAuditInputState', 'runAudit'];
    vm.runInContext(functions.map(extractFunction).join('\n'), context);
    context.adjustFooterPosition = hasResults => context.syncAuditWorkspaceLayout(hasResults);
    const flushFrames = () => {
        while (frames.length) frames.shift()();
    };
    const setManual = () => {
        nodes.get('auditMode').value = 'manual';
        radios.forEach(radio => { radio.checked = radio.value === 'manual'; });
        manual.classList.remove('hidden');
        context.setAnalysisModeState('manual');
        flushFrames();
    };
    const has = (node, name) => node.classList.contains(name);
    return { context, document, nodes, home, hero, input, manual, loading, results, main,
        search, marketing, radios, requests, events, flushFrames, setManual, has };
}

test('focus and mode belong to the standalone form while the marketing hero stays hidden', () => {
    const h = createHarness();
    h.context.setAnalysisFocusState(true);
    h.setManual();
    assert(h.has(h.input, 'is-analysis-focus'));
    assert(h.has(h.input, 'is-manual-mode'));
    assert(h.has(h.hero, 'hidden'));
    assert(!h.has(h.hero, 'is-manual-mode'));
    assert(h.has(h.document.body, 'audit-manual-open'));
});

test('automatic and manual inputs never lock global scrolling, including short viewports', () => {
    for (const height of [320, 480, 900]) {
        const h = createHarness({ height });
        h.context.syncAuditWorkspaceLayout();
        for (const node of [h.document.body, h.document.documentElement]) {
            assert(h.has(node, 'audit-input-open'));
            assert(!h.has(node, 'audit-workspace-locked'));
        }
        assert.equal(h.main.style.height, '0px');
        h.setManual();
        assert(h.has(h.document.body, 'audit-manual-open'));
        assert(!h.has(h.document.body, 'audit-workspace-locked'));
    }
});

test('loading hides input and marketing but keeps the empty shell suppressed', () => {
    const h = createHarness();
    h.setManual();
    h.context.showHomeAnalysisState();
    h.loading.classList.remove('hidden');
    h.flushFrames();
    assert(h.marketing.every(node => h.has(node, 'hidden')));
    assert(h.has(h.home, 'is-showing-audit'));
    assert(h.has(h.document.body, 'audit-home-workspace'));
    assert(!h.has(h.document.body, 'audit-input-open'));
    assert(!h.has(h.document.body, 'audit-manual-open'));
    assert(!h.has(h.document.body, 'audit-workspace-locked'));
    assert.equal(h.main.style.height, '0px');
});

test('visible results release all input layout flags and restore the main container', () => {
    const h = createHarness();
    h.context.syncAuditWorkspaceLayout();
    h.results.classList.remove('hidden');
    h.context.syncAuditWorkspaceLayout();
    for (const flag of ['audit-home-workspace', 'audit-input-open', 'audit-manual-open', 'audit-workspace-locked']) {
        assert(!h.has(h.document.body, flag));
        assert(!h.has(h.document.documentElement, flag));
    }
    assert.equal(h.main.style.height, '');
    assert(h.has(h.main, 'overflow-y-auto'));
});

test('restoring a failed manual audit reopens the form with the selected persona mode', () => {
    const h = createHarness();
    h.setManual();
    h.context.showHomeAnalysisState();
    h.loading.classList.remove('hidden');
    h.flushFrames();
    h.context.restoreAuditInputState('manual');
    h.flushFrames();
    assert(!h.has(h.home, 'is-showing-audit'));
    assert(h.has(h.loading, 'hidden'));
    assert(h.has(h.input, 'is-manual-mode'));
    assert(!h.has(h.manual, 'hidden'));
    assert(h.has(h.document.body, 'audit-input-open'));
    assert(h.has(h.document.body, 'audit-manual-open'));
});

test('returning to simplified input resets manual mode, result state and URL', () => {
    const h = createHarness();
    h.setManual();
    h.context.showHomeAnalysisState();
    h.results.classList.remove('hidden');
    h.context.showSimplifiedSearch();
    h.flushFrames();
    assert(!h.has(h.home, 'is-showing-audit'));
    assert(!h.has(h.input, 'is-manual-mode'));
    assert(h.has(h.input, 'is-analysis-focus'));
    assert(h.has(h.manual, 'hidden'));
    assert(h.has(h.results, 'hidden'));
    assert.equal(h.nodes.get('auditMode').value, 'auto');
    assert.equal(h.nodes.get('auditUrl').value, '');
    assert(h.radios[0].checked);
    assert(h.has(h.document.body, 'audit-input-open'));
});

test('guest landing restores marketing without enabling the authenticated workspace', () => {
    const h = createHarness({ authenticated: false });
    h.context.showHomeLandingState();
    h.flushFrames();
    assert(h.marketing.every(node => !h.has(node, 'hidden')));
    assert(h.has(h.search, 'hidden'));
    assert(!h.has(h.document.body, 'audit-input-open'));
    assert(!h.has(h.document.body, 'audit-home-workspace'));
});

test('legacy hero fallback retains the previous automatic/manual scroll behavior', () => {
    const h = createHarness({ standalone: false });
    h.hero.classList.remove('hidden');
    h.context.syncAuditWorkspaceLayout();
    assert(h.has(h.document.body, 'audit-workspace-locked'));
    h.setManual();
    assert(!h.has(h.document.body, 'audit-workspace-locked'));
    assert(h.has(h.document.body, 'audit-manual-open'));
});

test('HTTP 402 restores manual controls after the real submit path enters loading', async () => {
    const h = createHarness();
    h.setManual();
    const request = h.context.runAudit();
    h.flushFrames();
    await request;
    h.flushFrames();
    assert.equal(h.requests.length, 1);
    const payload = JSON.parse(h.requests[0].options.body);
    assert.equal(payload.modo, 'manual');
    assert.deepEqual(payload.personas, ['persona-example']);
    assert.equal(payload.url, 'https://example.invalid/');
    assert(h.events.some(event => event[0] === 'reset-captcha'));
    assert(h.events.some(event => event[0] === 'credits-ended'));
    assert(h.has(h.loading, 'hidden'));
    assert(!h.has(h.home, 'is-showing-audit'));
    assert(h.has(h.input, 'is-manual-mode'));
    assert(!h.has(h.manual, 'hidden'));
    assert(h.has(h.document.body, 'audit-input-open'));
    assert(h.has(h.document.body, 'audit-manual-open'));
});
