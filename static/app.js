const API_URL = "http://127.0.0.1:5000/generate";

const inputsContainer = document.getElementById("inputs-container");

for (let i = 0; i < 11; i++) {
    adicionarInput();
}

function adicionarInput() {

    const input = document.createElement("input");

    input.type = "text";

    input.placeholder = "Ex: Neymar";

    input.className = `
        w-full
        bg-[#0b1220]
        border
        border-white/5
        rounded-2xl
        px-4
        py-4
        text-sm
        outline-none
        focus:border-lime-400
        transition-all
    `;

    inputsContainer.appendChild(input);
}

document
.getElementById("team-form")
.addEventListener("submit", gerarEscalacao);


async function gerarEscalacao(event) {

    event.preventDefault();

    const loading = document.getElementById("loading-screen");

    loading.classList.remove("hidden");
    loading.classList.add("flex");

    const inputs = document.querySelectorAll("#inputs-container input");

    const jogadores = [];

    inputs.forEach(input => {

        if (input.value.trim() !== "") {
            jogadores.push(input.value.trim());
        }
    });

    try {

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                jogadores
            })
        });

        const data = await response.json();

        if (data.status !== "success") {

            alert(data.message);

            loading.classList.add("hidden");

            return;
        }

        renderizarResultado(data);

    } catch (error) {

        console.error(error);

        alert("Erro ao gerar escalação.");

    } finally {

        loading.classList.remove("flex");
        loading.classList.add("hidden");
    }
}


function renderizarResultado(data) {

    const resultado = document.getElementById("resultado-container");

    resultado.classList.remove("hidden");

    document.getElementById("team-nome").innerText =
    data.dados_escalacao.nome_do_time;

    document.getElementById("team-estilo").innerText =
    data.analise.estilo;

    document.getElementById("team-quimica").innerText =
    data.analise.quimica;

    document.getElementById("team-qualidades").innerText =
    data.dados_escalacao.qualidades_do_time;

    document.getElementById("team-dica").innerText =
    data.analise.dica;

    const field = document.getElementById("field-players");

    field.innerHTML = "";

    data.dados_escalacao.jogadores.forEach(jogador => {

        const info =
        data.info_real_jogadores[jogador];

        const card = document.createElement("div");

        card.className = `
            group
            relative
            rounded-3xl
            overflow-hidden
            bg-gradient-to-b
            from-[#1d293d]
            to-[#09111f]
            border
            border-lime-400/20
            hover:border-lime-400
            transition-all
            duration-300
            hover:-translate-y-2
            p-4
            cursor-pointer
        `;

        card.innerHTML = `

            <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(163,255,0,0.2),transparent_50%)]"></div>

            <div class="relative z-10 flex flex-col items-center text-center">

                <span class="text-5xl font-black text-lime-400 fifa-font">
                    ${info?.estatisticas?.overall || 80}
                </span>

                <img
                src="${info?.foto || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}"
                class="w-24 h-24 object-cover rounded-full border-4 border-white/10 mt-2">

                <h4 class="mt-4 text-sm font-bold uppercase leading-tight">
                    ${jogador}
                </h4>

                <span class="text-xs text-gray-400 mt-2 uppercase">
                    ${info?.time || 'Sem Clube'}
                </span>

                <div class="grid grid-cols-3 gap-2 mt-4 w-full text-xs">

                    <div class="bg-black/30 rounded-xl p-2">
                        ⚡ ${info?.estatisticas?.pace || 0}
                    </div>

                    <div class="bg-black/30 rounded-xl p-2">
                        🎯 ${info?.estatisticas?.shooting || 0}
                    </div>

                    <div class="bg-black/30 rounded-xl p-2">
                        🧠 ${info?.estatisticas?.passing || 0}
                    </div>

                </div>

            </div>
        `;

        field.appendChild(card);
    });
}


async function compartilharTime() {

    const nomeTime =
    document.getElementById("team-nome").innerText;

    const texto =
    `⚽ Meu Ultimate Team:\n\n${nomeTime}`;

    if (navigator.share) {

        await navigator.share({
            title: nomeTime,
            text: texto
        });

    } else {

        navigator.clipboard.writeText(texto);

        alert("Texto copiado!");
    }
}