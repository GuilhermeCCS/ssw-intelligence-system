/** Build an allowlisted public artifact; never publish the repository root. */
const fs = require('node:fs');
const path = require('node:path');

const publicDirectories = ['src/app', 'src/assets', 'src/components', 'src/config', 'src/styles', 'src/utils', 'src/vendor'];
const publicExtensions = new Set(['.js', '.css', '.html', '.fragment', '.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg', '.ico', '.pdf', '.woff', '.woff2', '.ttf', '.mp4', '.webm']);
const errors = {
    400: ['Confira os dados enviados', 'Não foi possível entender esta solicitação. Revise os dados e tente novamente.'],
    401: ['Entre na sua conta', 'Sua sessão terminou ou esta página precisa de autenticação.'],
    403: ['Acesso indisponível', 'Sua conta não tem permissão para acessar este conteúdo.'],
    404: ['Esta página não foi encontrada', 'O endereço pode ter mudado ou a página não está mais disponível.'],
    405: ['Esta ação não está disponível', 'Volte à página anterior e use as ações disponíveis na plataforma.'],
    408: ['A solicitação levou mais tempo', 'Confira sua conexão e tente novamente em instantes.'],
    429: ['Aguarde um momento', 'Recebemos várias solicitações. Espere um pouco antes de tentar novamente.'],
    500: ['Não foi possível concluir agora', 'Ocorreu um problema ao processar a solicitação. Tente novamente em instantes.'],
    502: ['Não conseguimos conectar', 'Um serviço está temporariamente indisponível. Tente novamente em instantes.'],
    503: ['Voltamos em breve', 'A plataforma está temporariamente indisponível. Tente novamente em alguns instantes.']
};
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

function copyPublicDirectory(source, destination) {
    if (!fs.existsSync(source)) return;
    if (fs.lstatSync(source).isSymbolicLink()) throw new Error('Public source directories cannot be symbolic links.');
    for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
        if (entry.isSymbolicLink() || entry.name.startsWith('.') || /^(tests?|__tests__|debug|backups?|logs|tmp)$/i.test(entry.name)) continue;
        const from = path.join(source, entry.name);
        const to = path.join(destination, entry.name);
        if (entry.isDirectory()) copyPublicDirectory(from, to);
        else if (publicExtensions.has(path.extname(entry.name).toLowerCase()) || /^LICEN[CS]E(?:\..*)?$/.test(entry.name)) {
            fs.mkdirSync(destination, { recursive: true });
            if (entry.name.endsWith('.js')) {
                fs.writeFileSync(to, fs.readFileSync(from, 'utf8').replace(/^\/\/[#@] sourceMappingURL=.*$/gm, ''));
            } else fs.copyFileSync(from, to);
        }
    }
}

function buildSite({ root = path.resolve(__dirname, '..'), production = false, env = process.env } = {}) {
    root = fs.realpathSync(root);
    const output = path.resolve(root, 'dist');
    if (path.dirname(output) !== root || (fs.existsSync(output) && fs.lstatSync(output).isSymbolicLink())) {
        throw new Error('Invalid build output directory.');
    }
    const mpKey = env.VITE_MP_PUBLIC_KEY || '';
    const apiUrl = env.API_URL || 'https://ssw-intelligence-api.onrender.com';
    const googleId = env.VITE_GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID || '';
    if (production && !mpKey) throw new Error('VITE_MP_PUBLIC_KEY is required for a production build.');
    const parsedApi = new URL(apiUrl);
    if (!['https:', 'http:'].includes(parsedApi.protocol) || parsedApi.username || parsedApi.password || (production && parsedApi.protocol !== 'https:')) {
        throw new Error('API_URL must be a public HTTPS endpoint in production.');
    }
    if (production && /^(localhost|127\.|\[?::1\]?)/i.test(parsedApi.hostname)) throw new Error('Production API_URL cannot use loopback.');
    const template = fs.readFileSync(path.join(root, 'src/pages/errors/template.html'), 'utf8');
    // Validate config before replacing the previous local artifact. Only root/dist is removed.
    fs.rmSync(output, { recursive: true, force: true });
    fs.mkdirSync(output, { recursive: true });
    publicDirectories.forEach(directory => copyPublicDirectory(path.join(root, directory), path.join(output, directory)));
    const runtime = [['env-mp-public-key', mpKey], ['env-api-url', apiUrl], ['env-google-client-id', googleId]];
    for (const file of ['index.html', 'precos/index.html', 'termos/index.html', 'sites/index.html']) {
        let html = fs.readFileSync(path.join(root, file), 'utf8');
        html = html.replace(/^[\t ]*<meta name="env-(?:mp-public-key|api-url|google-client-id)" content="[^"]*">\r?\n?/gm, '');
        html = html.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n    ' + runtime.filter(([, value]) => value).map(([name, value]) => '<meta name="' + name + '" content="' + escapeHtml(value) + '">').join('\n    '));
        const target = path.join(output, file);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, html);
    }
    for (const file of ['_headers', 'robots.txt', 'sitemap.xml']) fs.copyFileSync(path.join(root, 'public', file), path.join(output, file));
    fs.copyFileSync(path.join(root, '_redirects'), path.join(output, '_redirects'));
    fs.mkdirSync(path.join(output, 'errors'), { recursive: true });
    for (const [code, [title, description]] of Object.entries(errors)) {
        const html = template.replaceAll('{{code}}', code).replaceAll('{{title}}', title).replaceAll('{{description}}', description);
        fs.writeFileSync(path.join(output, 'errors', code + '.html'), html);
        if (code === '404') fs.writeFileSync(path.join(output, '404.html'), html);
    }
    return output;
}

if (require.main === module) {
    require('dotenv').config({ quiet: true });
    try {
        buildSite({ production: process.argv.includes('--production') });
        console.log('Public build created in dist/. Source files were not modified.');
    } catch (error) {
        console.error('Build failed: ' + error.message);
        process.exitCode = 1;
    }
}
module.exports = { buildSite, publicDirectories, errors };
