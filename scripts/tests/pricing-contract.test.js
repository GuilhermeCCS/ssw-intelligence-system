const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const rootDir = path.resolve(__dirname, '../..');
const pricingDir = path.join(rootDir, 'src/components/pricing');
const source = fs.readFileSync(path.join(pricingDir, 'pricing-component.js'), 'utf8');
const fragment = fs.readFileSync(path.join(pricingDir, 'pricing-component.fragment'), 'utf8');

// Commercial contract verified against backend TABELA_PRECOS. Values are the
// total charged and all credits delivered by each approved purchase.
const contract = {
    freelancer_10_mensal: [99, 10], freelancer_15_mensal: [129, 15], freelancer_20_mensal: [159, 20],
    freelancer_10_anual: [948, 120], freelancer_15_anual: [1236, 180], freelancer_20_anual: [1524, 240],
    agencia_20_mensal: [149, 20], agencia_30_mensal: [179, 30], agencia_40_mensal: [219, 40],
    agencia_20_anual: [1428, 240], agencia_30_anual: [1716, 360], agencia_40_anual: [2100, 480],
    recarga_10: [47, 10], recarga_40: [167, 40], recarga_90: [347, 90],
};

const optionAttributes = [...fragment.matchAll(/<button\b[^>]*data-package-monthly=[^>]*>/g)].map(match =>
    Object.fromEntries([...match[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(attr => [attr[1], attr[2]]))
);

function loadPricing() {
    const root = { dataset: { billingCycle: 'monthly' } };
    const context = vm.createContext({
        console,
        document: {
            getElementById: () => root,
            addEventListener() {},
            head: { insertAdjacentHTML() {} },
        },
        window: { addEventListener() {} },
    });
    vm.runInContext(source, context);
    return { root, context, catalog: vm.runInContext('SSW_PRICING_PACKAGES', context) };
}

test('every current and legacy checkout package keeps the contracted total and credits', () => {
    const { catalog } = loadPricing();
    assert.equal(Object.keys(catalog).length, 25);
    for (const [alias, item] of Object.entries(catalog)) {
        assert.ok(contract[item.id], `Unknown checkout package: ${alias} -> ${item.id}`);
        assert.deepEqual([item.preco, item.creditos], contract[item.id], alias);
    }
});

test('all 12 plan/cycle choices show the exact total, delivered credits and preserve checkout IDs', () => {
    const { root, context } = loadPricing();
    assert.equal(optionAttributes.length, 6);
    let checkoutId;
    context.comprarPlano = id => { checkoutId = id; };

    for (const attrs of optionAttributes) {
        const option = { dataset: { packageMonthly: attrs['data-package-monthly'], packageAnnual: attrs['data-package-annual'] } };
        const amount = {}, credits = {}, total = {}, period = {};
        const nodes = {
            '.ssw-credit-options button.is-active': option,
            '.ssw-amount': amount, '.ssw-credit-note': credits,
            '.ssw-installment': total, '.ssw-period': period,
        };
        const card = { querySelector: selector => nodes[selector], querySelectorAll: () => [option] };
        for (const cycle of ['monthly', 'annual']) {
            root.dataset.billingCycle = cycle;
            const annual = cycle === 'annual';
            const id = annual ? option.dataset.packageAnnual : option.dataset.packageMonthly;
            const [price, creditCount] = contract[id];
            const equivalent = price / (annual ? 12 : 1);
            const currency = price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            assert.equal(Number(attrs[`data-${cycle}-price`]), equivalent, `${id}: option price`);
            context.sswUpdatePlanCard(card);
            assert.equal(amount.textContent, equivalent.toLocaleString('pt-BR'), `${id}: displayed price`);
            assert.equal(period.textContent, annual ? '/mês equivalente' : '/mês');
            assert.equal(credits.textContent, `${creditCount} créditos de auditoria no pacote ${annual ? 'anual' : 'mensal'}`);
            assert.equal(option.textContent, `${creditCount} créditos`);
            assert.equal(total.textContent, `${annual ? 'Total anual' : 'Total desta compra'}: R$ ${currency}. Condições de pagamento no checkout.`);
            assert.doesNotMatch(total.textContent, /12x|sem juros/i);
            context.comprarPlanoFromCard({ closest: () => card });
            assert.equal(checkoutId, id, `${id}: checkout routing`);
        }
    }
});

test('billing toggle reflects annual, monthly and invalid-cycle fallback accessibly', () => {
    const { root, context } = loadPricing();
    const buttons = ['monthly', 'annual'].map(cycle => ({
        dataset: { cycle },
        classList: { toggle(name, value) { this.active = value; } },
        setAttribute(name, value) { this[name] = value; },
    }));
    root.querySelectorAll = selector => selector === '.ssw-billing-toggle button' ? buttons : [];
    for (const cycle of ['annual', 'monthly', 'invalid']) {
        context.sswSetBillingCycle(cycle);
        const expected = cycle === 'annual' ? cycle : 'monthly';
        assert.equal(root.dataset.billingCycle, expected);
        for (const button of buttons) {
            assert.equal(button['aria-pressed'], String(button.dataset.cycle === expected));
            assert.equal(button.classList.active, button.dataset.cycle === expected);
        }
    }
});

test('pricing includes totals for both purchasable cards and only supported resource limits', () => {
    assert.equal((fragment.match(/class="ssw-installment"/g) || []).length, 2);
    assert.match(fragment, /Até 3 personas personalizadas/);
    assert.match(fragment, /Até 8 personas personalizadas/);
    assert.match(fragment, /Até 30 dias/);
    assert.match(fragment, /Até 90 dias/);
    assert.doesNotMatch(fragment, /White Label|Multiusuários|12 personas|5 personas|sem juros|12x|cancele quando quiser|cancelamento fácil|renovação automática/i);
});

const backendFile = path.resolve(rootDir, '../sswapi-main/app/api/main.py');
test('when the sibling backend is present, its price table agrees with the frontend contract', { skip: !fs.existsSync(backendFile) }, () => {
    const backend = fs.readFileSync(backendFile, 'utf8');
    const priceTable = backend.match(/TABELA_PRECOS\s*=\s*\{([\s\S]*?)\n\}/)?.[1];
    assert.ok(priceTable, 'Backend price table must be available for cross-repository verification');
    for (const [id, expected] of Object.entries(contract)) {
        const row = priceTable.match(new RegExp(`"${id}"\\s*:\\s*\\{([^}]+)\\}`))?.[1];
        assert.ok(row, `Backend package absent: ${id}`);
        const price = Number(row.match(/"preco"\s*:\s*([\d.]+)/)?.[1]);
        const credits = Number(row.match(/"creditos"\s*:\s*(\d+)/)?.[1]);
        assert.deepEqual([price, credits], expected, `${id}: backend price/credits`);
    }
});
