async function loadRanking() {
    console.log("loadRanking chamado");
    const firstName = document.getElementById('podiumFirstName');
    const firstScore = document.getElementById('podiumFirstScore');
    const secondName = document.getElementById('podiumSecondName');
    const secondScore = document.getElementById('podiumSecondScore');
    const thirdName = document.getElementById('podiumThirdName');
    const thirdScore = document.getElementById('podiumThirdScore');
    const rankingList = document.getElementById('rankingList');
    const rankingTotalCount = document.getElementById('rankingTotalCount');

    const setLoadingState = () => {
        [firstName, firstScore, secondName, secondScore, thirdName, thirdScore].forEach(el => {
            if (el) el.textContent = '--';
        });
        if (rankingTotalCount) rankingTotalCount.textContent = '0';
        if (rankingList) {
            rankingList.innerHTML = '<div class="p-6 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-950/60 to-blue-950/40 text-center text-slate-300">Carregando dados do mercado...</div>';
        }
    };

    const setPodium = (nameEl, scoreEl, site, placeholder) => {
        if (!nameEl || !scoreEl) return;
        if (!site) {
            nameEl.textContent = placeholder;
            scoreEl.textContent = '--';
            return;
        }
        nameEl.textContent = site.site_name || 'Sem Nome';
        scoreEl.textContent = site.score !== undefined ? site.score : '--';
    };

    setLoadingState();

    try {
        const res = await fetch(`${API_URL}/api/ranking`);
        const data = await res.json();

        if (!res.ok) {
            throw new Error("Erro na API");
        }

        data.sort((a, b) => b.score - a.score);
        if (rankingTotalCount) rankingTotalCount.textContent = `${data.length}`;

        const [first, second, third, ...others] = data;

        setPodium(firstName, firstScore, first, 'Sem dados');
        setPodium(secondName, secondScore, second, 'Sem dados');
        setPodium(thirdName, thirdScore, third, 'Sem dados');

        if (rankingList) {
            if (others.length === 0) {
                rankingList.innerHTML = '<div class="p-4 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-950/60 to-blue-950/40 text-slate-300">Nenhum outro colocado registrado ainda.</div>';
            } else {
                rankingList.innerHTML = others.map((site, idx) => {
                    let scoreColor = 'text-slate-300';
                    if (site.score >= 50) scoreColor = 'text-cyan-300';
                    if (site.score >= 80) scoreColor = 'text-emerald-300';

                    return `
                        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-950/60 to-blue-950/40 transition hover:border-cyan-400/40 hover:bg-gradient-to-br hover:from-cyan-950/80 hover:to-blue-950/60">
                            <div class="flex items-center gap-3">
                                <span class="font-mono text-cyan-300 text-xs">#${idx + 4}</span>
                                <div>
                                    <div class="font-semibold text-white">${site.site_name || 'Sem Nome'}</div>
                                    <div class="text-cyan-200 text-xs">${site.niche || 'Nicho não informado'}</div>
                                </div>
                            </div>
                            <span class="font-bold ${scoreColor} text-lg">${site.score !== undefined ? site.score : '--'}</span>
                        </div>
                    `;
                }).join('');
            }
        }

        console.log("ranking carregado com sucesso");
    } catch (e) {
        console.error("Erro no loadRanking:", e);
        if (rankingList) {
            rankingList.innerHTML = '<div class="p-4 rounded-2xl border border-red-500 bg-red-500/10 text-red-400 text-center">Erro ao carregar ranking.</div>';
        }
        if (rankingTotalCount) rankingTotalCount.textContent = '0';

        setPodium(firstName, firstScore, null, 'Sem dados');
        setPodium(secondName, secondScore, null, 'Sem dados');
        setPodium(thirdName, thirdScore, null, 'Sem dados');
    }
}