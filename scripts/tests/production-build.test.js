const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { buildSite, errors } = require('../build');
const { createPreviewServer } = require('../serve-dist');
const project = path.resolve(__dirname, '../..');

function fixture(t) {
    const temporary = fs.realpathSync(os.tmpdir());
    const root = fs.mkdtempSync(path.join(temporary, 'ssw-build-test-'));
    t.after(() => {
        assert.equal(path.dirname(root), temporary);
        assert(path.basename(root).startsWith('ssw-build-test-'));
        fs.rmSync(root, { recursive: true, force: true });
    });
    const write = (file, content) => { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), content); };
    for (const file of ['index.html', 'precos/index.html', 'termos/index.html', 'sites/index.html']) write(file, '<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"></head><body>Produto</body></html>');
    for (const file of ['public/_headers', 'public/robots.txt', 'public/sitemap.xml', '_redirects', 'src/pages/errors/template.html']) write(file, fs.readFileSync(path.join(project, file)));
    write('src/app/main.js', 'console.info("public");\n//# sourceMappingURL=main.js.map');
    for (const file of ['.env', '.git/config', 'package.json', 'docs/schema.sql', 'scripts/test.js', 'node_modules/private.js', 'src/app/.env', 'src/app/main.js.map', 'src/app/tests/token.js', 'src/pages/tools/debug.html']) write(file, 'PRIVATE_SENTINEL');
    return { root, write };
}

test('production build allowlists public files and never mutates source HTML', t => {
    const { root } = fixture(t);
    const before = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const dist = buildSite({ root, production: true, env: { VITE_MP_PUBLIC_KEY: 'TEST-public', API_URL: 'https://api.example.com' } });
    assert.equal(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), before);
    assert(fs.existsSync(path.join(dist, '_headers')));
    assert(!fs.readFileSync(path.join(dist, 'src/app/main.js'), 'utf8').includes('sourceMappingURL'));
    const files = fs.readdirSync(dist, { recursive: true }).filter(file => fs.statSync(path.join(dist, file)).isFile());
    for (const file of files) assert(!fs.readFileSync(path.join(dist, file), 'utf8').includes('PRIVATE_SENTINEL'), file);
    for (const code of Object.keys(errors)) assert(fs.existsSync(path.join(dist, 'errors', code + '.html')));
});

test('runtime metadata is escaped and production rejects unsafe configuration before replacing output', t => {
    const { root, write } = fixture(t);
    const dist = buildSite({ root, production: true, env: { VITE_MP_PUBLIC_KEY: 'TEST-public"/><script>bad()</script>' } });
    const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
    assert(!html.includes('<script>bad()'));
    assert(html.includes('&quot;/&gt;&lt;script&gt;'));
    write('dist/previous.txt', 'keep');
    for (const env of [{}, { VITE_MP_PUBLIC_KEY: 'TEST-public', API_URL: 'http://api.example.com' }, { VITE_MP_PUBLIC_KEY: 'TEST-public', API_URL: 'https://user:pass@api.example.com' }]) {
        assert.throws(() => buildSite({ root, production: true, env }));
        assert.equal(fs.readFileSync(path.join(dist, 'previous.txt'), 'utf8'), 'keep');
    }
});

test('all declared routes, redirects, security headers and real HTTP errors work in the public artifact', async t => {
    const { root } = fixture(t);
    const dist = buildSite({ root, env: {} });
    const server = createPreviewServer(dist);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise(resolve => server.close(resolve)));
    const origin = 'http://127.0.0.1:' + server.address().port;
    const rules = fs.readFileSync(path.join(dist, '_redirects'), 'utf8').split(/\r?\n/).filter(line => line.startsWith('/')).map(line => line.split(/\s+/));
    for (const [from, to, status] of rules) {
        const response = await fetch(origin + from + '?source=test', { redirect: 'manual' });
        assert.equal(response.status, Number(status), from);
        if (status !== '200') assert.equal(response.headers.get('location'), to + '?source=test');
    }
    for (const privatePath of ['/package.json', '/.env', '/.git/config', '/scripts/test.js', '/docs/schema.sql', '/node_modules/private.js', '/missing.js', '/not-found', '/_headers']) {
        const response = await fetch(origin + privatePath);
        assert.equal(response.status, 404, privatePath);
        assert((await response.text()).includes('Esta página não foi encontrada'));
        assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
        assert.equal(response.headers.get('x-frame-options'), 'DENY');
        assert(response.headers.get('content-security-policy').includes("frame-ancestors 'none'"));
    }
    const method = await fetch(origin + '/', { method: 'POST' });
    assert.equal(method.status, 405);
    assert.equal(method.headers.get('allow'), 'GET, HEAD');
    assert.equal((await fetch(origin + '/', { method: 'HEAD' })).status, 200);
});
