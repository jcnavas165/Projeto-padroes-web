const linhaTempo = document.querySelector(".timeline-vertical");
const eventosLinhaTempo = document.querySelectorAll(".timeline-event");

const botaoZoomMais = document.getElementById("zoomIn");
const botaoZoomMenos = document.getElementById("zoomOut");
const botaoReset = document.getElementById("resetTimeline");

const rotuloZoom = document.getElementById("zoomLabel");
const barraProgressoZoom = document.getElementById("zoomProgress");

const botoesPeriodo = document.querySelectorAll(".period-btn");

let zoomAtual = 0;
let periodoAtual = "all";
let scrollBloqueado = false;

const textosZoom = [
    "Visão geral",
    "Zoom médio: eventos principais",
    "Zoom máximo: detalhes e palavras"
];

// Atualiza o estado visual da linha do tempo conforme zoom e período selecionados.
function atualizarLinhaDoTempo() {
    linhaTempo.dataset.zoom = zoomAtual;

    eventosLinhaTempo.forEach((evento) => {
        const nivelEvento = Number(evento.dataset.level);
        const periodoEvento = evento.dataset.period;

        const visivelPorZoom = nivelEvento <= zoomAtual;
        const visivelPorPeriodo = periodoAtual === "all" || periodoEvento === periodoAtual;

        evento.hidden = !(visivelPorZoom && visivelPorPeriodo);
    });

    rotuloZoom.textContent = textosZoom[zoomAtual];
    barraProgressoZoom.style.width = `${zoomAtual * 50}%`;

    botoesPeriodo.forEach((botao) => {
        const ativo = botao.dataset.period === periodoAtual;
        botao.classList.toggle("active", ativo);
    });
}

// Aumenta o nível de zoom, respeitando o limite máximo.
function aumentarZoom() {
    if (zoomAtual < 2) {
        zoomAtual++;
        atualizarLinhaDoTempo();
        return true;
    }

    return false;
}

// Diminui o nível de zoom, respeitando o limite mínimo.
function diminuirZoom() {
    if (zoomAtual > 0) {
        zoomAtual--;
        atualizarLinhaDoTempo();
        return true;
    }

    return false;
}

// Restaura os filtros padrão da linha do tempo.
function resetarLinhaDoTempo() {
    zoomAtual = 0;
    periodoAtual = "all";
    atualizarLinhaDoTempo();
}

// Define o período ativo e ajusta o zoom mínimo quando necessário.
function selecionarPeriodo(periodo) {
    periodoAtual = periodo;

    if (periodoAtual !== "all" && zoomAtual === 0) {
        zoomAtual = 1;
    }

    atualizarLinhaDoTempo();
}

// Aplica zoom com a roda do mouse sem impedir rolagem fora dos limites.
function lidarComScrollZoom(evento) {
    if (scrollBloqueado) {
        evento.preventDefault();
        return;
    }

    let zoomAlterado = false;

    if (evento.deltaY < 0) {
        zoomAlterado = aumentarZoom();
    } else if (evento.deltaY > 0) {
        zoomAlterado = diminuirZoom();
    }

    if (!zoomAlterado) {
        return;
    }

    evento.preventDefault();
    scrollBloqueado = true;

    setTimeout(() => {
        scrollBloqueado = false;
    }, 450);
}

// Trata clique para aumentar o zoom.
function aoClicarZoomMais() {
    aumentarZoom();
}

// Trata clique para diminuir o zoom.
function aoClicarZoomMenos() {
    diminuirZoom();
}

botaoZoomMais.addEventListener("click", aoClicarZoomMais);
botaoZoomMenos.addEventListener("click", aoClicarZoomMenos);
botaoReset.addEventListener("click", resetarLinhaDoTempo);

botoesPeriodo.forEach((botao) => {
    botao.addEventListener("click", () => {
        selecionarPeriodo(botao.dataset.period);
    });
});

linhaTempo.addEventListener("wheel", lidarComScrollZoom, { passive: false });

atualizarLinhaDoTempo();
