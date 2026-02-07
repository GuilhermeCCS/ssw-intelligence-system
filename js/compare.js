async function runCompare() {
    const user = getUser();
    if (user.credits < 2) return alert("Você precisa de 2 licenças.");

    const urlA = document.getElementById('urlA').value;
    const urlB = document.getElementById('urlB').value;
    
    if (!urlA || !urlB) return alert("Preencha os dois sites.");

    const btn = event.target;
    btn.innerText = "ANALISANDO... (Aguarde 60s)";
    btn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/api/comparar`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url_a: urlA,
                url_b: urlB,
                user_id: String(user.id),
                personas: []
            })
        });

        const data = await res.json();
        btn.innerText = "INICIAR BATALHA";
        btn.disabled = false;

        if (!res.ok) return alert(data.detail || "Erro no comparativo.");

        // Atualiza créditos (desconta 2)
        user.credits = data.novo_saldo;
        localStorage.setItem('ssw_user', JSON.stringify(user));
        document.getElementById('userCredits').innerText = user.credits;

        // Exibe resultado (Aqui formatei simples, mas você pode melhorar a tabela)
        document.getElementById('compareResult').classList.remove('hidden');
        document.getElementById('compareJson').innerText = JSON.stringify(data.comparativo, null, 2);

    } catch (e) {
        alert("Erro: " + e);
        btn.innerText = "INICIAR BATALHA";
        btn.disabled = false;
    }
}