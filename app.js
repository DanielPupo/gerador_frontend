// app.js

// Altere para a URL correta de produção ou deixe localhost se estiver testando localmente
const API_URL = "http://127.0.0.1:5000/generate";

const containerInputs = document.getElementById('inputs-container');
const spinner = document.getElementById('loading-spinner');
const btnEnviar = document.getElementById('btn-enviar');
const placeholderView = document.getElementById('placeholder-view');
const resultadoContainer = document.getElementById('resultado-container');
const errorContainer = document.getElementById('error-message');
const playerModal = document.getElementById('player-modal');

// Memória local para guardar o banco de dados enriquecido vindo do Flask
let dbJogadoresReais = {};

// Inicializa a aplicação criando os 11 inputs iniciais padrão automaticamente
document.addEventListener("DOMContentLoaded", () => {
    carregarInputsIniciais();
});

function carregarInputsIniciais() {
    containerInputs.innerHTML = "";
    for(let i = 1; i <= 11; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Jogador ${i}`;
        input.required = true;
        input.className = 'jogador-input w-full bg-[#16192b] text-white placeholder-gray-500 text-sm p-3 border border-gray-800 rounded-lg focus:ring-2 focus:ring-lime-400 focus:outline-none transition';
        containerInputs.appendChild(input);
    }
}

function adicionarInput() {
    const totalInputs = containerInputs.querySelectorAll('.jogador-input').length + 1;
    const wrapper = document.createElement('div');
    wrapper.className = 'flex gap-2 items-center w-full animate-fade-in';
    wrapper.innerHTML = `
        <input type="text" placeholder="Jogador ${totalInputs}" required class="jogador-input w-full bg-[#16192b] text-white placeholder-gray-500 text-sm p-3 border border-gray-800 rounded-lg focus:ring-2 focus:ring-lime-400 focus:outline-none transition">
        <button type="button" onclick="this.parentElement.remove(); reorganizarPlaceholders();" class="bg-red-950/60 hover:bg-red-900 text-red-400 border border-red-900/50 font-bold p-3 rounded-lg transition text-sm px-4">✕</button>
    `;
    containerInputs.appendChild(wrapper);
}

function reorganizarPlaceholders() {
    const inputs = containerInputs.querySelectorAll('.jogador-input');
    inputs.forEach((input, index) => { input.placeholder = `Jogador ${index + 1}`; });
}

async function gerarEscalacao(event) {
    event.preventDefault();
    const inputs = document.querySelectorAll('.jogador-input');
    const jogadores = Array.from(inputs).map(i => i.value.trim()).filter(valor => valor !== "");

    errorContainer.classList.add('hidden');
    spinner.classList.remove('hidden');
    btnEnviar.disabled = true;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jogadores: jogadores })
        });
        const data = await response.json();
        
        if (data.status === "success") {
            placeholderView.classList.add('hidden');
            // Armazena o mapeamento de fotos/stats retornado pelo backend
            dbJogadoresReais = data.info_real_jogadores || {};
            exibirEscalacao(data.dados_escalacao);
        } else {
            mostrarErro(data.message || "Erro interno de processamento.");
        }
    } catch (error) {
        mostrarErro("Falha crítica ao conectar com o servidor Flask. Verifique se o app.py está rodando.");
    } finally {
        spinner.classList.add('hidden');
        btnEnviar.disabled = false;
    }
}

function exibirEscalacao(escalacao) {
    document.getElementById('team-nome').innerText = escalacao.nome_do_time;
    document.getElementById('team-quantidade').innerText = escalacao.quantidade_de_jogadores;
    document.getElementById('team-qualidades').innerText = escalacao.qualidades_do_time;
    
    const gridCampo = document.getElementById('field-players-grid');
    gridCampo.innerHTML = ""; 

    // Distribuição tática das linhas do campinho visual
    const linhasTaticas = { ataque: [], meio: [], defesa: [], goleiro: [] };
    escalacao.jogadores.forEach((player, idx) => {
        if(idx === 0) linhasTaticas.goleiro.push(player);
        else if(idx >= 1 && idx <= 4) linhasTaticas.defesa.push(player);
        else if(idx >= 5 && idx <= 8) linhasTaticas.meio.push(player);
        else linhasTaticas.ataque.push(player);
    });

    const construirLinhaDoCampo = (jogadoresDaLinha) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = "flex justify-center w-full gap-2 sm:gap-6";
        
        jogadoresDaLinha.forEach(nomeCompleto => {
            const match = nomeCompleto.match(/(.*?)\((.*?)\)/);
            const nome = match ? match[1].trim() : nomeCompleto;
            const clube = match ? match[2].trim() : "Pro Club";

            const dadosApiSports = dbJogadoresReais[nomeCompleto];
            let layoutFotoHtml = `<div class="w-6 h-6 rounded-full bg-gray-800 text-[10px] mx-auto mb-0.5 flex items-center justify-center">👤</div>`;
            
            if (dadosApiSports && dadosApiSports.foto) {
                layoutFotoHtml = `<img src="${dadosApiSports.foto}" class="w-7 h-7 rounded-full object-cover mx-auto mb-0.5 border border-lime-400/50">`;
            }

            const playerCard = document.createElement('div');
            playerCard.className = "bg-black/80 border border-lime-400/30 rounded-lg p-1 text-center w-20 sm:w-24 shadow-lg backdrop-blur-sm transform hover:scale-110 transition cursor-pointer";
            playerCard.onclick = () => openPlayerModal(nome, clube, nomeCompleto);
            playerCard.innerHTML = `
                ${layoutFotoHtml}
                <div class="text-[9px] sm:text-[11px] font-black truncate text-white uppercase tracking-tight">${nome}</div>
                <div class="text-[7px] sm:text-[8px] text-lime-400 font-semibold truncate uppercase tracking-widest">${clube}</div>
            `;
            rowDiv.appendChild(playerCard);
        });
        gridCampo.appendChild(rowDiv);
    };

    // Montando o campo de cima para baixo (Ataque até Goleiro)
    construirLinhaDoCampo(linhasTaticas.ataque);
    construirLinhaDoCampo(linhasTaticas.meio);
    construirLinhaDoCampo(linhasTaticas.defesa);
    construirLinhaDoCampo(linhasTaticas.goleiro);

    // Renderizando a lista de Reservas com suas respectivas fotos
    const ulReservas = document.getElementById('team-reservas');
    ulReservas.innerHTML = "";
    if (escalacao.jogadores_reservas && escalacao.jogadores_reservas.length > 0) {
        escalacao.jogadores_reservas.forEach(res => {
            const matchRes = res.match(/(.*?)\((.*?)\)/);
            const nomeRes = matchRes ? matchRes[1].trim() : res;
            const clubeRes = matchRes ? matchRes[2].trim() : "Suplente";

            const dadosApiReserva = dbJogadoresReais[res];
            let fotoHtml = `<span class="text-lime-400 text-xs">▲</span>`;
            if (dadosApiReserva && dadosApiReserva.foto) {
                fotoHtml = `<img src="${dadosApiReserva.foto}" class="w-5 h-5 rounded-full inline-block border border-lime-400/40 object-cover">`;
            }
            
            const li = document.createElement('li');
            li.className = "flex items-center gap-2 border-b border-gray-900 pb-1.5 text-gray-300 hover:text-white cursor-pointer transition";
            li.onclick = () => openPlayerModal(nomeRes, clubeRes, res);
            li.innerHTML = `${fotoHtml} <span class="text-sm">${res}</span>`;
            ulReservas.appendChild(li);
        });
    } else {
        ulReservas.innerHTML = `<li class="italic text-gray-600 text-xs">Nenhum suplente escalado.</li>`;
    }

    // Plano Tático Coletivo
    const ulVariabilidade = document.getElementById('team-variabilidade');
    ulVariabilidade.innerHTML = "";
    escalacao.variabilidade_do_time.forEach(varia => {
        const li = document.createElement('li');
        li.className = "text-gray-400 text-sm pl-1";
        li.innerText = varia;
        ulVariabilidade.appendChild(li);
    });

    resultadoContainer.classList.remove('hidden');
    resultadoContainer.scrollIntoView({ behavior: 'smooth' });
}

// Controle do Modal Detalhado (Card Estilo FIFA)
function openPlayerModal(playerName, playerTeam, chaveCompleta) {
    document.getElementById('modal-player-name').innerText = playerName;
    document.getElementById('modal-player-team').innerText = playerTeam;
    
    const imgTag = document.getElementById('modal-player-img');
    const fallbackTag = document.getElementById('modal-player-fallback');
    const clubLogoTag = document.getElementById('modal-club-logo');
    
    const dadosFutebol = dbJogadoresReais[chaveCompleta];

    if (dadosFutebol) {
        imgTag.src = dadosFutebol.foto;
        imgTag.classList.remove('hidden');
        fallbackTag.classList.add('hidden');

        if(dadosFutebol.logo_clube) {
            clubLogoTag.src = dadosFutebol.logo_clube;
            clubLogoTag.classList.remove('hidden');
        } else {
            clubLogoTag.classList.add('hidden');
        }

        document.getElementById('stat-ovr').innerText = dadosFutebol.stats.ovr;
        document.getElementById('stat-pac').innerText = dadosFutebol.stats.pac;
        document.getElementById('stat-sho').innerText = dadosFutebol.stats.sho;
        document.getElementById('stat-pas').innerText = dadosFutebol.stats.pas;
        document.getElementById('stat-dri').innerText = dadosFutebol.stats.dri;
        document.getElementById('stat-def').innerText = dadosFutebol.stats.def;
    } else {
        imgTag.classList.add('hidden');
        clubLogoTag.classList.add('hidden');
        fallbackTag.classList.remove('hidden');
        
        document.getElementById('stat-ovr').innerText = "--";
        document.getElementById('stat-pac').innerText = "--";
        document.getElementById('stat-sho').innerText = "--";
        document.getElementById('stat-pas').innerText = "--";
        document.getElementById('stat-dri').innerText = "--";
        document.getElementById('stat-def').innerText = "--";
    }

    playerModal.classList.remove('hidden');
}

function closePlayerModal() { playerModal.classList.add('hidden'); }
playerModal.addEventListener('click', function(e) { if (e.target === playerModal) closePlayerModal(); });

function mostrarErro(mensagem) {
    errorContainer.innerText = mensagem;
    errorContainer.classList.remove('hidden');
    resultadoContainer.classList.add('hidden');
    placeholderView.classList.remove('hidden');
}

function reiniciarFormulario() {
    carregarInputsIniciais();
    resultadoContainer.classList.add('hidden');
    placeholderView.classList.remove('hidden');
    errorContainer.classList.add('hidden');
    closePlayerModal();
}