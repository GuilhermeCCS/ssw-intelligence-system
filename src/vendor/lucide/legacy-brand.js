/**
 * Compatibility for the existing Instagram link after Lucide 1 removed brands.
 * Instagram SVG: lucide v0.577.0, ISC (see LICENSE).
 * Source: https://unpkg.com/lucide@0.577.0/dist/esm/icons/instagram.js
 */
(() => {
    const createIcons = window.lucide.createIcons;
    const Instagram = [
        ['rect', { width: '20', height: '20', x: '2', y: '2', rx: '5', ry: '5' }],
        ['path', { d: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z' }],
        ['line', { x1: '17.5', x2: '17.51', y1: '6.5', y2: '6.5' }]
    ];
    window.lucide.createIcons = (options = {}) => createIcons({
        ...options,
        icons: { ...window.lucide.icons, Instagram, ...options.icons }
    });
})();
