let currentChatHistory = [];
let currentPersona = null;

function openChat(persona) {
    currentPersona = persona;
    currentChatHistory = []; // Limpa histórico novo
    
    document.getElementById('chatModal').classList.remove('hidden');
    document.getElementById('chatPersonaName').innerText = persona.profile_name;
    document.getElementById('chatHistory').innerHTML = `
        <div class="text-center text-xs text-slate-500 my-4">Chat iniciado com ${persona.profile_name}</div>
    `;
}

function closeChat() {
    document.getElementById('chatModal').classList.add('hidden');
}

async function sendChat() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;

    // 1. Adiciona msg do usuário na tela
    appendMsg('user', msg);
    input.value = "";
    
    // 2. Prepara histórico para API
    currentChatHistory.push({ role: "user", content: msg });
    
    // 3. Loading visual
    const loadingId = appendMsg('ai', 'Digitando...');

    try {
        const res = await fetch(`${API_URL}/api/chat`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                historico: currentChatHistory,
                persona: { profile_name: currentPersona.profile_name, score: currentPersona.score },
                meta: window.CURRENT_META || { title: "Site Auditado" }
            })
        });

        const data = await res.json();
        
        // Remove loading e põe resposta
        document.getElementById(loadingId).remove();
        
        const resposta = data.resposta || "Erro na IA.";
        appendMsg('ai', resposta);
        currentChatHistory.push({ role: "assistant", content: resposta });

    } catch (e) {
        document.getElementById(loadingId).innerText = "Erro de conexão.";
    }
}

function appendMsg(role, text) {
    const div = document.createElement('div');
    const id = "msg-" + Date.now();
    div.id = id;
    
    if (role === 'user') {
        div.className = "flex justify-end";
        div.innerHTML = `<div class="bg-emerald-600 text-white p-3 rounded-l-lg rounded-br-lg max-w-[80%] text-sm">${text}</div>`;
    } else {
        div.className = "flex justify-start";
        div.innerHTML = `<div class="bg-slate-800 text-slate-200 p-3 rounded-r-lg rounded-bl-lg max-w-[80%] text-sm">${text}</div>`;
    }
    
    const container = document.getElementById('chatHistory');
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return id;
}