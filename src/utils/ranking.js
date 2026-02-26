async function loadRanking() {
    console.log("loadRanking chamado");
    const tbody = document.getElementById('rankingTable');
    console.log("tbody encontrado:", tbody);
    
    // Mostra loading enquanto carrega
    tbody.innerHTML = "<tr><td colspan='4' class='p-4 text-center text-slate-500'>Carregando dados do mercado...</td></tr>";

    try {
        // Busca dados da API
        const res = await fetch(`${API_URL}/api/ranking`);
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error("Erro na API");
        }
        
        // Ordena por score (maior para menor)
        data.sort((a, b) => b.score - a.score);

        tbody.innerHTML = ""; // Limpa a tabela
        console.log("tabela limpa");

        if (data.length === 0) {
            tbody.innerHTML = "<tr><td colspan='4' class='p-4 text-center text-slate-500'>Nenhum dado registrado ainda.</td></tr>";
            return;
        }

        data.forEach((site, index) => {
            console.log("processando site:", site);
            // Define a cor da nota
            let scoreColor = "text-red-400";
            if (site.score >= 50) scoreColor = "text-yellow-400";
            if (site.score >= 80) scoreColor = "text-emerald-400";

            // Cria a linha da tabela com 4 colunas separadas
            const tr = document.createElement('tr');
            tr.className = "border-b border-slate-800 hover:bg-slate-900/50 transition";
            tr.innerHTML = `
                <td class="p-4">
                    <span class="font-mono text-slate-500 text-xs">#${index + 1}</span>
                </td>
                <td class="p-4">
                    <span class="font-bold text-white">${site.site_name}</span>
                </td>
                <td class="p-4 text-slate-400 text-sm">${site.niche}</td>
                <td class="p-4 text-right font-bold ${scoreColor}">${site.score}</td>
            `;
            tbody.appendChild(tr);
        });

        console.log("ranking carregado com sucesso");

    } catch (e) {
        console.error("Erro no loadRanking:", e);
        tbody.innerHTML = "<tr><td colspan='4' class='p-4 text-center text-red-400'>Erro ao carregar ranking.</td></tr>";
    }
}