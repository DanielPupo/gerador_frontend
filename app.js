// URL local do backend para testes rápidos
const API_URL = "http://127.0.0.1:5000/generate";

document.getElementById('teamForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const promptInput = document.getElementById('promptInput').value.trim();
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('errorCard');
    const errorMessage = document.getElementById('errorMessage');
    const resultContainer = document.getElementById('resultContainer');
    
    if (!promptInput) return;

    // Reset de estado da interface
    loadingElement.classList.remove('hidden');
    errorElement.classList.add('hidden');
    resultContainer.classList.add('hidden');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: promptInput })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Erro no servidor: Código ${response.status}`);
        }

        if (data.status === 'error') {
            throw new Error(data.message || 'Erro desconhecido do servidor.');
        }

        renderSquad(data.dados_escalacao || data);

    } catch (err) {
        console.error(err);
        errorMessage.textContent = err.message || "Falha crítica ao conectar com o servidor do Gerador.";
        errorElement.classList.remove('hidden');
    } finally {
        loadingElement.classList.add('hidden');
    }
});

function renderSquad(data) {
    const resultContainer = document.getElementById('resultContainer');
    
    // Atualiza metadados do time estilo Ultimate Team
    document.getElementById('teamNameDisplay').textContent = data.nome_do_time || "SQUAD CUSTOMIZADO";
    document.getElementById('tacticalDisplay').textContent = `Formação: ${data.formacao_tatica || "N/A"} | Estilo: ${data.estilo_de_jogo || "Padrão"}`;
    document.getElementById('chemistryDisplay').textContent = `🧪 Química: ${data.quimica_total || 0}/33`;

    // Renderiza titulares no campo tático
    const pitch = document.getElementById('tacticalPitch');
    pitch.innerHTML = ''; // Limpa o campo anterior

    if (data.jogadores && Array.isArray(data.jogadores)) {
        data.jogadores.forEach((player) => {
            const card = document.createElement('div');
            card.className = "fifa-card-gold pack-open-anim text-black p-1 flex flex-col justify-between shadow-2xl relative cursor-pointer select-none";
            
            // Renderização da imagem (Fallback robusto com iniciais caso não possua URL externa)
            const playerInitial = player.nome_completo.charAt(0);
            const avatarHtml = `<div class="w-12 h-12 rounded-full bg-black/10 mx-auto flex items-center justify-center font-black text-lg border border-black/20 text-amber-950">${playerInitial}</div>`;

            card.innerHTML = `
                <div class="flex justify-between items-start px-1 pt-1">
                    <div class="flex flex-col items-center">
                        <span class="text-xs font-black leading-none">${player.overall}</span>
                        <span class="text-[8px] font-extrabold uppercase text-amber-900">${player.posicao_campo}</span>
                    </div>
                </div>
                <div class="my-1">${avatarHtml}</div>
                <div class="text-[9px] font-black uppercase truncate text-center px-1">${player.nome_completo.split(' ')[0]}</div>
                <div class="text-[7px] text-amber-950 font-semibold truncate text-center max-w-[90%] mx-auto leading-none">${player.clube}</div>
                <div class="grid grid-cols-2 gap-x-1 text-[7px] font-bold border-t border-black/10 mt-1 pt-0.5 px-1 text-center">
                    <div>${player.stats.pac} PAC</div>
                    <div>${player.stats.dri} DRI</div>
                    <div>${player.stats.sho} SHO</div>
                    <div>${player.stats.def} DEF</div>
                    <div>${player.stats.pas} PAS</div>
                    <div>${player.stats.phy} PHY</div>
                </div>
                <div class="text-[6px] bg-black/10 rounded-sm py-0.5 text-center mt-0.5 font-extrabold text-amber-900 truncate">⭐ ${player.playstyle_plus}</div>
            `;
            pitch.appendChild(card);
        });
    }

    // Renderiza Banco de Reservas
    const benchContainer = document.getElementById('benchContainer');
    benchContainer.innerHTML = '';
    if (data.jogadores_reservas && Array.isArray(data.jogadores_reservas)) {
        data.jogadores_reservas.forEach(reserva => {
            const li = document.createElement('li');
            li.className = "bg-zinc-800 border border-zinc-700 rounded p-2 flex justify-between items-center text-sm";
            li.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="bg-amber-500 text-black text-xs font-black px-1.5 py-0.5 rounded">${reserva.overall}</span>
                    <div>
                        <p class="font-bold text-white">${reserva.nome_completo}</p>
                        <p class="text-xs text-gray-400">${reserva.clube}</p>
                    </div>
                </div>
                <span class="text-xs font-bold text-amber-400 uppercase bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">${reserva.posicao_campo}</span>
            `;
            benchContainer.appendChild(li);
        });
    }

    // Renderiza Instruções Táticas
    const instructionsList = document.getElementById('instructionsList');
    instructionsList.innerHTML = '';
    if (data.instrucoes_de_jogador && Array.isArray(data.instrucoes_de_jogador)) {
        data.instrucoes_de_jogador.forEach(instrucao => {
            const li = document.createElement('li');
            li.className = "text-zinc-300 text-xs border-l-2 border-amber-500 pl-2 py-1";
            li.textContent = instrucao;
            instructionsList.appendChild(li);
        });
    }

    resultContainer.classList.remove('hidden');
    resultContainer.scrollIntoView({ behavior: 'smooth' });
}