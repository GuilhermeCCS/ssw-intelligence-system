// Compatibility API for diagnostic tooling. Never intercept console methods or
// cancel browser errors: production failures must remain observable.
(() => {
    const buffer = [];
    const capture = (level) => {
        buffer.push({ level: ['error', 'warn', 'info'].includes(level) ? level : 'info', at: new Date().toISOString() });
        if (buffer.length > 120) buffer.shift();
    };
    window.SSWConsole = {
        debug: false,
        dump: () => buffer.slice(),
        capture,
        enable: () => false,
        disable: () => false
    };
    window.addEventListener('error', () => capture('error'));
    window.addEventListener('unhandledrejection', () => capture('error'));
})();
