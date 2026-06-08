(function () {
    const DEBUG_KEY = 'SSW_DEBUG';
    const methods = ['log', 'info', 'debug', 'warn', 'error', 'trace', 'table', 'group', 'groupCollapsed', 'groupEnd'];
    const original = {};
    methods.forEach((method) => {
        original[method] = typeof console[method] === 'function'
            ? console[method].bind(console)
            : function () {};
    });

    const isDebugEnabled = (() => {
        try {
            const params = new URLSearchParams(window.location.search);
            return localStorage.getItem(DEBUG_KEY) === '1' || params.has('debug');
        } catch (_) {
            return false;
        }
    })();

    const buffer = [];
    const normalizeArg = (arg) => {
        if (arg instanceof Error) {
            return { name: arg.name, message: arg.message, stack: arg.stack };
        }
        if (typeof arg === 'string') return arg;
        try {
            return JSON.parse(JSON.stringify(arg));
        } catch (_) {
            return String(arg);
        }
    };

    const capture = (level, args) => {
        buffer.push({
            level,
            at: new Date().toISOString(),
            args: Array.from(args || []).map(normalizeArg)
        });
        if (buffer.length > 120) buffer.shift();
    };

    window.SSWConsole = {
        debug: isDebugEnabled,
        dump: () => buffer.slice(),
        capture: (level, args) => capture(level || 'log', Array.isArray(args) ? args : [args]),
        enable: () => {
            localStorage.setItem(DEBUG_KEY, '1');
            window.location.reload();
        },
        disable: () => {
            localStorage.removeItem(DEBUG_KEY);
            window.location.reload();
        }
    };

    if (isDebugEnabled) return;

    methods.forEach((method) => {
        console[method] = function () {
            capture(method, arguments);
        };
    });

    window.addEventListener('error', (event) => {
        capture('error', [
            event.message || 'Script error',
            event.filename || '',
            event.lineno || 0,
            event.colno || 0
        ]);
        event.preventDefault();
    }, true);

    window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason;
        capture('error', [reason instanceof Error ? reason : String(reason || 'Unhandled promise rejection')]);
        event.preventDefault();
    });
})();
