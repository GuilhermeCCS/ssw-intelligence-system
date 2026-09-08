const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const test = require('node:test');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function pdfRuntime() {
    const saved = [];
    const errors = [];
    const c = {
        console, atob, btoa, TextEncoder, TextDecoder, Uint8Array, ArrayBuffer, Blob,
        navigator: { userAgent: 'ssw-offline-regression' },
        document: { createElement: () => ({}), getElementById: () => null, querySelector: () => null },
        Toast: { success() {}, error: message => errors.push(message) },
        currentAuditUrl: null, auditData: null
    };
    c.window = c;
    c.self = c;
    vm.createContext(c);
    vm.runInContext(read('src/vendor/jspdf/jspdf.umd.min.js'), c);
    vm.runInContext(read('src/vendor/jspdf-autotable/jspdf.plugin.autotable.min.js'), c);
    c.jspdf.jsPDF.API.save = function (name) {
        saved.push({ name, pages: this.internal.getNumberOfPages(), data: this.output() });
    };
    const source = read('src/app/core/main.js');
    const start = source.indexOf('        function gerarPDFOficialLegado(');
    const end = source.indexOf('        Object.assign(window,', start);
    assert(start >= 0 && end > start);
    vm.runInContext(source.slice(start, end), c);
    return { c, saved, errors };
}

test('browser dependencies match their reviewed release artifacts', () => {
    const hashes = {
        'jspdf/jspdf.umd.min.js': 'e6551fcdc32f09d6853b2c5126d18d01d9447e0da618a41a11ebeee0f6c20d54',
        'jspdf-autotable/jspdf.plugin.autotable.min.js': 'a65dff2c6a8296b16aff24e69f7683cd7dbaed4a4ec26b507d6840ee27d54649',
        'lucide/lucide.min.js': '762fcb80e079ea4068f0f39f4fb0a5b3749d6be97e5d2fd46293fa4adf6ecbf1'
    };
    for (const [file, expected] of Object.entries(hashes)) {
        const bytes = fs.readFileSync(path.join(root, 'src/vendor', file));
        assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), expected, file);
        assert(fs.existsSync(path.join(root, 'src/vendor', path.dirname(file), 'LICENSE')));
    }
});

test('the existing legacy and premium exporters generate complete PDFs with the patched runtime', () => {
    const { c, saved, errors } = pdfRuntime();
    assert.equal(c.jspdf.jsPDF.version, '4.2.1');
    const fixture = {
        url: 'https://example.invalid',
        technical_audit: {
            score: 82,
            executive_summary: 'Relatório de regressão com acentuação e análise técnica.',
            real_metrics: { performance_score: 68, seo_score: 91, accessibility_score: 82, lcp: '2.1s', load_time: '3s' },
            vulnerabilities: [{ title: 'Contraste do texto', description: 'Melhorar legibilidade no celular.', severity: 'Médio', pillar: 'Acessibilidade' }],
            action_plan: ['Reduzir o peso das imagens.', 'Ajustar os contrastes.']
        },
        agents_results: [{ profile_name: 'Visitante', score: 8, direct_quote: 'Gostei do serviço.', journey_log: [{ action: 'Leitura', status: 'Concluída' }] }],
        images: { desktop: 'data:image/png;base64,' + fs.readFileSync(path.join(root, 'src/assets/images/logo/logo_ofc.png')).toString('base64') }
    };
    c.gerarPDFOficialLegado(structuredClone(fixture));
    c.gerarPDFOficial(structuredClone(fixture));
    assert.deepEqual(errors, []);
    assert.equal(saved.length, 2);
    for (const pdf of saved) {
        assert(pdf.data.startsWith('%PDF-'));
        assert(pdf.data.includes('%%EOF'));
        assert.equal(pdf.pages, 2);
        assert(pdf.data.includes('example.invalid'));
        assert(pdf.data.includes('Reduzir o peso das imagens.'));
    }
    assert(saved[1].data.includes('/Subtype /Image'), 'Premium capture is embedded');
});

test('multi-page AutoTable retains pagination and the hooks used by the product', () => {
    const { c } = pdfRuntime();
    const doc = new c.jspdf.jsPDF();
    const pages = [];
    doc.autoTable({
        head: [['Problema', 'Recomendação']],
        body: Array.from({ length: 90 }, (_, i) => [`Problema ${i + 1}`, 'Texto de regressão para verificar quebra de linha e paginação.']),
        styles: { overflow: 'linebreak', fontSize: 9, cellPadding: 2 },
        didDrawPage: data => pages.push(data.cursor.y)
    });
    assert(doc.internal.getNumberOfPages() > 1);
    assert.equal(pages.length, doc.internal.getNumberOfPages());
    assert(Number.isFinite(doc.lastAutoTable.finalY));
    assert(doc.output().includes('Problema 90'));
});

test('the pinned Lucide bundle exposes every literal icon used by production templates', () => {
    const c = { console };
    c.window = c;
    vm.createContext(c);
    vm.runInContext(read('src/vendor/lucide/lucide.min.js'), c);
    assert.equal(typeof c.lucide.createIcons, 'function');
    let configuredIcons;
    c.lucide.createIcons = options => { configuredIcons = options.icons; };
    vm.runInContext(read('src/vendor/lucide/legacy-brand.js'), c);
    c.lucide.createIcons();
    const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => entry.isDirectory()
        ? walk(path.join(dir, entry.name)) : /\.(html|fragment|js)$/.test(entry.name) ? [path.join(dir, entry.name)] : []);
    const files = ['index.html', 'precos/index.html', 'termos/index.html', 'sites/index.html', ...walk('src/app'), ...walk('src/components')];
    const icons = new Set(files.flatMap(file => [...read(file).matchAll(/data-lucide="([a-z][a-z0-9-]+)"/g)].map(match => match[1])));
    for (const name of icons) {
        const key = name.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('');
        assert(configuredIcons[key], `Missing icon: ${name}`);
    }
    assert(icons.size > 40);
});
