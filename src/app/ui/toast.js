// Toast Notification System - Substitui window.alert()
        const Toast = {
            show(message, type = 'info', duration = 10000) {
                const container = document.getElementById('toastContainer');
                const icons = { success: 'check-circle', error: 'x-circle', warning: 'alert-triangle', info: 'info' };
                const colors = { success: '#10B981', error: '#EF4444', warning: '#F59E0B', info: '#22d3ee' };
                const toast = document.createElement('div');
                toast.className = `toast toast-${type}`;
                toast.innerHTML = `
                    <i data-lucide="${icons[type] || 'info'}" style="width:20px;height:20px;color:${colors[type] || '#22d3ee'};flex-shrink:0;"></i>
                    <div style="flex:1;"><p style="margin:0;font-size:14px;font-weight:500;color:white;">${message}</p></div>
                    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:#8292a8;cursor:pointer;padding:4px;">
                        <i data-lucide="x" style="width:16px;height:16px;"></i>
                    </button>
                `;
                container.appendChild(toast);
                if (typeof lucide !== 'undefined') lucide.createIcons();
                setTimeout(() => {
                    toast.classList.add('hiding');
                    setTimeout(() => toast.remove(), 300);
                }, duration);
            }
        };
        Toast.success = (m, d) => Toast.show(m, 'success', d);
        Toast.error = (m, d) => Toast.show(m, 'error', d);
        Toast.warning = (m, d) => Toast.show(m, 'warning', d);
        Toast.info = (m, d) => Toast.show(m, 'info', d);
