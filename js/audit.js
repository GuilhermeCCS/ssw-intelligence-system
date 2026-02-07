// js/audit.js

// Alterna a visibilidade dos checkboxes
function togglePersonaSelect() {
    const mode = document.getElementById('auditMode').value;
    const selectArea = document.getElementById('manualPersonaSelect');
    
    if(mode === 'manual') {
        selectArea.classList.remove('hidden');
        // Chama a função que criamos no personas.js!
        if(typeof loadChecklistForAudit === 'function') {
            loadChecklistForAudit();
        } else {
            console.error("Função loadChecklistForAudit não encontrada. Verifique se personas.js foi carregado.");
        }
    } else {
        selectArea.classList.add('hidden');
    }
}

async function runAudit() {
    const user = getUser();
    if (user.credits <= 0) {
        if(confirm("Saldo insuficiente. Deseja recarregar via WhatsApp?")) buyCredits();
        return;
    }

    const url = document.getElementById('auditUrl').value;
    const mode = document.getElementById('auditMode').value;
    
    // ARRAY DE PERSONAS
    let selectedPersonas = [];

    if (!url) return alert("Por favor, digite a URL do site.");

    // SE FOR MANUAL, PEGA OS CHECKBOXES
    if (mode === 'manual') {
        const checkboxes = document.querySelectorAll('.persona-checkbox:checked');
        checkboxes.forEach(cb => selectedPersonas.push(cb.value)); // value é o nome da persona

        if(selectedPersonas.length === 0) {
            return alert("Modo Manual: Você precisa selecionar pelo menos um perfil na lista abaixo!");
        }
    }

    // UI Feedback
    document.getElementById('auditLoading').classList.remove('hidden');
    document.getElementById('auditResults').classList.add('hidden');

    try {
        const res = await fetch(`${API_URL}/api/auditar`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: url,
                user_id: String(user.id),
                modo: mode,
                personas: selectedPersonas // <--- AQUI ESTÁ A MÁGICA
            })
        });

        const data = await res.json();
        document.getElementById('auditLoading').classList.add('hidden');

        if (!res.ok) {
            if(res.status === 402) {
                if(confirm("Seus créditos acabaram. Recarregar agora?")) buyCredits();
            } else {
                alert("Erro na análise: " + (data.detail || JSON.stringify(data)));
            }
            return;
        }

        // Sucesso
        user.credits = data.novo_saldo;
        localStorage.setItem('ssw_user', JSON.stringify(user));
        document.getElementById('userCredits').innerText = user.credits;

        // Renderiza
        document.getElementById('auditResults').classList.remove('hidden');
        document.getElementById('resScore').innerText = data.resultado.technical_audit.score;
        document.getElementById('resNiche').innerText = data.meta.niche_detected || "Geral";
        
        if (data.images) {
            document.getElementById('printMobile').src = "data:image/jpeg;base64," + data.images.mobile;
            document.getElementById('printDesktop').src = "data:image/jpeg;base64," + data.images.desktop;
        }

        // Renderiza Cards de Personas com Chat
        const grid = document.getElementById('personasGrid');
        grid.innerHTML = "";
        window.CURRENT_META = data.meta; 

        data.resultado.personas_results.forEach(p => {
            const div = document.createElement('div');
            div.className = "glass p-5 rounded-xl border border-slate-800 hover:border-emerald-500/50 transition flex flex-col justify-between";
            div.innerHTML = `
                <div>
                    <div class="flex justify-between mb-3">
                        <h4 class="font-bold text-white text-sm truncate">${p.profile_name}</h4>
                        <span class="bg-emerald-900/30 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded text-xs font-bold">${p.score}/10</span>
                    </div>
                    <p class="text-xs text-slate-300 italic mb-4 border-l-2 border-slate-700 pl-3 leading-relaxed">"${p.direct_quote}"</p>
                </div>
                <button onclick='openChat(${JSON.stringify(p)})' class="w-full bg-slate-800 hover:bg-slate-700 text-xs text-white py-3 rounded-lg flex items-center justify-center gap-2 transition font-medium">
                    <i data-lucide="message-circle" class="w-3 h-3"></i> Conversar com a IA
                </button>
            `;
            grid.appendChild(div);
        });
        
        lucide.createIcons();

    } catch (e) {
        alert("Erro fatal de conexão: " + e);
        document.getElementById('auditLoading').classList.add('hidden');
    }
}