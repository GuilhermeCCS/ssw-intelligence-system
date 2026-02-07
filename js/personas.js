// js/personas.js

// 1. CARREGA A LISTA NA TELA DE GESTÃO
async function loadManagePersonas() {
    const user = getUser(); // Pega do config.js
    const listDiv = document.getElementById('managePersonasList');
    
    listDiv.innerHTML = "<p class='text-slate-500 text-sm animate-pulse'>Carregando perfis...</p>";

    try {
        const res = await fetch(`${API_URL}/api/personas?user_id=${user.id}`);
        const data = await res.json();
        
        listDiv.innerHTML = "";
        const lista = data.custom_personas || [];

        if(lista.length === 0) {
            listDiv.innerHTML = "<div class='col-span-3 text-center text-slate-600 py-10 border border-slate-800 rounded border-dashed'>Nenhum perfil criado ainda.</div>";
            return;
        }

        lista.forEach(p => {
            const card = document.createElement('div');
            card.className = "glass p-4 rounded-xl border border-slate-800 relative group hover:border-slate-600 transition";
            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <h4 class="font-bold text-white text-sm">${p.name}</h4>
                    <button onclick="deletePersona('${p.id}')" class="text-slate-600 hover:text-red-500 transition" title="Excluir">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
                <p class="text-xs text-slate-400 mt-2 line-clamp-3">${p.description}</p>
            `;
            listDiv.appendChild(card);
        });
        
        lucide.createIcons(); // Atualiza ícones

    } catch(e) {
        listDiv.innerHTML = "<p class='text-red-400'>Erro ao carregar lista.</p>";
        console.error(e);
    }
}

// 2. CRIA UMA NOVA PERSONA
async function createPersona() {
    const user = getUser();
    const nomeInput = document.getElementById('newPersonaName');
    const descInput = document.getElementById('newPersonaDesc');
    const btn = document.getElementById('btnCreatePersona');
    
    const nome = nomeInput.value.trim();
    const desc = descInput.value.trim();

    if(!nome || !desc) return alert("Preencha o nome e a descrição do perfil.");

    btn.innerText = "Salvando...";
    btn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/api/personas`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                user_id: String(user.id),
                nome: nome,
                descricao: desc
            })
        });

        if(res.ok) {
            nomeInput.value = "";
            descInput.value = "";
            await loadManagePersonas(); // Recarrega a lista
            // Se estivermos no modo manual lá na auditoria, recarrega os checkboxes também
            loadChecklistForAudit(); 
        } else {
            alert("Erro ao criar persona.");
        }
    } catch(e) { alert("Erro de conexão: " + e); }
    
    btn.innerText = "CRIAR PERFIL";
    btn.disabled = false;
}

// 3. DELETA UMA PERSONA
async function deletePersona(id) {
    if(!confirm("Tem certeza que deseja excluir este perfil?")) return;
    const user = getUser();

    try {
        await fetch(`${API_URL}/api/personas/${id}?user_id=${user.id}`, { method: 'DELETE' });
        loadManagePersonas();
        loadChecklistForAudit(); // Atualiza os checkboxes também
    } catch(e) { alert("Erro ao deletar."); }
}

// 4. CARREGA OS CHECKBOXES NA TELA DE AUDITORIA (MODO MANUAL)
async function loadChecklistForAudit() {
    const user = getUser();
    const container = document.getElementById('checklistPersonas');
    const msg = document.getElementById('noPersonasMsg');
    
    if(!container) return; // Segurança caso a div não exista

    container.innerHTML = "<span class='text-xs text-slate-500'>Carregando...</span>";
    msg.classList.add('hidden');

    try {
        const res = await fetch(`${API_URL}/api/personas?user_id=${user.id}`);
        const data = await res.json();
        const lista = data.custom_personas || [];

        container.innerHTML = "";

        if(lista.length === 0) {
            msg.classList.remove('hidden');
            return;
        }

        lista.forEach(p => {
            const label = document.createElement('label');
            label.className = "flex items-center gap-2 bg-slate-900/50 p-2 rounded border border-slate-700 cursor-pointer hover:border-emerald-500/50 transition select-none";
            label.innerHTML = `
                <input type="checkbox" value="${p.name}" class="persona-checkbox accent-emerald-500 w-4 h-4">
                <div class="overflow-hidden">
                    <p class="text-xs font-bold text-slate-200 truncate">${p.name}</p>
                    <p class="text-[10px] text-slate-500 truncate">${p.description}</p>
                </div>
            `;
            container.appendChild(label);
        });

    } catch(e) { container.innerHTML = "Erro ao carregar opções."; }
}