// Notifications accept plain text only, including messages returned by APIs.
const Toast = {
    show(message, type = 'info', duration = 10000) {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        const icons = { success: 'check-circle', error: 'x-circle', warning: 'alert-triangle', info: 'info' };
        const colors = { success: '#10B981', error: '#EF4444', warning: '#F59E0B', info: '#22d3ee' };
        const safeType = Object.prototype.hasOwnProperty.call(icons, type) ? type : 'info';
        const toast = document.createElement('div');
        toast.className = `toast toast-${safeType}`;
        toast.setAttribute('role', safeType === 'error' ? 'alert' : 'status');
        toast.setAttribute('aria-atomic', 'true');
        toast.innerHTML = `
            <i data-lucide="${icons[safeType]}" aria-hidden="true" style="width:20px;height:20px;color:${colors[safeType]};flex-shrink:0;"></i>
            <div style="flex:1;"><p style="margin:0;font-size:14px;font-weight:500;color:white;"></p></div>
            <button type="button" aria-label="Fechar notificação" style="background:none;border:none;color:#8292a8;cursor:pointer;padding:4px;">
                <i data-lucide="x" aria-hidden="true" style="width:16px;height:16px;"></i>
            </button>
        `;
        toast.querySelector('p').textContent = String(message ?? '');
        toast.querySelector('button').addEventListener('click', () => toast.remove());
        container.appendChild(toast);
        if (typeof lucide !== 'undefined') lucide.createIcons();
        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        }, Number.isFinite(duration) ? Math.max(1000, duration) : 10000);
    }
};
Toast.success = (m, d) => Toast.show(m, 'success', d);
Toast.error = (m, d) => Toast.show(m, 'error', d);
Toast.warning = (m, d) => Toast.show(m, 'warning', d);
Toast.info = (m, d) => Toast.show(m, 'info', d);
