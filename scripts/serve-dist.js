/** Local production-artifact preview. No repository files or fallback for unknown routes. */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.pdf': 'application/pdf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.webm': 'video/webm', '.fragment': 'text/html; charset=utf-8' };

function createPreviewServer(root = path.resolve(__dirname, '../dist')) {
    root = fs.realpathSync(root);
    if (!fs.existsSync(path.join(root, '404.html'))) throw new Error('Run npm run build or npm run build:local before previewing dist/.');
    const redirects = fs.readFileSync(path.join(root, '_redirects'), 'utf8').split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#')).map(line => line.split(/\s+/));
    const headerRules = [];
    for (const line of fs.readFileSync(path.join(root, '_headers'), 'utf8').split(/\r?\n/)) {
        if (!line.trim() || line.trim().startsWith('#')) continue;
        if (line.startsWith('/')) headerRules.push({ pattern: line.trim(), headers: {} });
        else {
            const match = line.trim().match(/^([^:]+):\s*(.*)$/);
            if (match && headerRules.length) headerRules.at(-1).headers[match[1]] = match[2];
        }
    }
    return http.createServer((request, response) => {
        let pathname;
        let query;
        try {
            const parsed = new URL(request.url, 'http://localhost');
            pathname = decodeURIComponent(parsed.pathname);
            query = parsed.search;
        } catch { pathname = ''; }
        for (const rule of headerRules) {
            if (rule.pattern === '/*' || rule.pattern === pathname || (rule.pattern.endsWith('*') && pathname?.startsWith(rule.pattern.slice(0, -1)))) {
                for (const [name, value] of Object.entries(rule.headers)) response.setHeader(name, value);
            }
        }
        const sendFile = (file, status) => {
            response.statusCode = status;
            response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
            if (request.method === 'HEAD') return response.end();
            fs.createReadStream(file).on('error', () => { response.destroy(); }).pipe(response);
        };
        const sendError = status => sendFile(path.join(root, 'errors', status + '.html'), status);
        if (!['GET', 'HEAD'].includes(request.method)) { response.setHeader('Allow', 'GET, HEAD'); return sendError(405); }
        if (!pathname || /[\\\0]/.test(pathname) || pathname.split('/').some(part => part.startsWith('.') || part.startsWith('_'))) return sendError(404);
        const rule = redirects.find(([from]) => from === pathname);
        if (rule && Number(rule[2]) !== 200) {
            response.writeHead(Number(rule[2]), { Location: rule[1] + query });
            return response.end();
        }
        const publicPath = rule ? rule[1] : pathname;
        let file = path.resolve(root, '.' + publicPath);
        if (!file.startsWith(path.resolve(root) + path.sep) && file !== path.resolve(root)) return sendError(404);
        if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
        if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return sendError(404);
        if (!fs.realpathSync(file).startsWith(root + path.sep)) return sendError(404);
        return sendFile(file, pathname === '/404.html' ? 404 : 200);
    });
}
if (require.main === module) {
    const portIndex = process.argv.indexOf('--port');
    const port = portIndex >= 0 ? Number(process.argv[portIndex + 1]) : 4173;
    const host = process.env.HOST || '127.0.0.1';
    createPreviewServer().listen(port, host, () => console.log(`Public artifact preview: http://${host}:${port}`));
}
module.exports = { createPreviewServer };
