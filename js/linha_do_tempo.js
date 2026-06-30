const linhaTempo = document.querySelector(".timeline-vertical");
const eventosLinhaTempo = document.querySelectorAll(".timeline-event");

// Painel principal – botões de zoom
const botaoZoomMais = document.getElementById("zoomIn");
const botaoZoomMenos = document.getElementById("zoomOut");
const botaoReset = document.getElementById("resetTimeline");

// Painel principal – status de zoom
const rotuloZoom = document.getElementById("zoomLabel");
const barraProgressoZoom = document.getElementById("zoomProgress");

// Sidebar flutuante – botões de zoom
const botaoZoomMaisFloat = document.getElementById("zoomIn-float");
const botaoZoomMenosFloat = document.getElementById("zoomOut-float");
const botaoResetFloat = document.getElementById("resetTimeline-float");

// Sidebar flutuante – status de zoom
const rotuloZoomFloat = document.getElementById("zoomLabel-float");
const barraProgressoZoomFloat = document.getElementById("zoomProgress-float");

let zoomAtual = 0;

const textosZoom = [
    "Visão geral",
    "Zoom médio: eventos principais",
    "Zoom máximo: detalhes e palavras"
];

// Verifica se o viewport está em modo mobile.
function ehMobile() {
    return window.matchMedia("(max-width: 900px)").matches;
}

// Insere botão de expandir/ocultar e agrupa o corpo de cada card.
function inicializarToggleCards() {
    document.querySelectorAll(".timeline-card").forEach((card) => {
        const spanAno = card.querySelector(".timeline-year");
        if (!spanAno || card.querySelector(".timeline-card__toggle")) {
            return;
        }

        const titulo = card.querySelector("h2");

        // Envolve tudo abaixo do span do ano e do h2 em um div de corpo
        const corpo = document.createElement("div");
        corpo.className = "timeline-card__body";

        const filhos = Array.from(card.childNodes).filter(
            (n) => n !== spanAno && n !== titulo
        );
        filhos.forEach((filho) => corpo.appendChild(filho));
        card.appendChild(corpo);

        // Cria o botão de toggle
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "timeline-card__toggle";
        botao.setAttribute("aria-expanded", "true");
        botao.innerHTML = '<span class="timeline-toggle-icon" aria-hidden="true"></span>';

        // Envolve o ano e o botão em uma linha de cabeçalho
        const cabecalho = document.createElement("div");
        cabecalho.className = "timeline-card__header";
        card.insertBefore(cabecalho, spanAno);
        cabecalho.appendChild(spanAno);
        cabecalho.appendChild(botao);

        // Garante que o h2 fique logo após o cabeçalho, fora do corpo
        if (titulo) {
            card.insertBefore(titulo, corpo);
        }

        botao.addEventListener("click", () => {
            const estaRecolhido = card.classList.contains("timeline-card--collapsed");
            definirEstadoCard(card, !estaRecolhido);
        });

        // Estado inicial: recolhido no mobile, expandido no desktop
        definirEstadoCard(card, ehMobile());
    });
}

// Define o estado expandido/recolhido de um card.
function definirEstadoCard(card, recolhido) {
    const botao = card.querySelector(".timeline-card__toggle");
    card.classList.toggle("timeline-card--collapsed", recolhido);
    if (botao) {
        botao.setAttribute("aria-expanded", recolhido ? "false" : "true");
        botao.setAttribute("aria-label", recolhido ? "Expandir" : "Recolher");
    }
}

// Atualiza estado padrão de todos os cards ao redimensionar a janela.
function aoRedimensionar() {
    const mobile = ehMobile();
    document.querySelectorAll(".timeline-card").forEach((card) => {
        // Só redefine se o usuário não interagiu (ainda no estado padrão)
        if (card.dataset.interagido !== "true") {
            definirEstadoCard(card, mobile);
        }
    });
}

// Registra interação do usuário para não sobrescrever escolha manual
document.querySelectorAll(".timeline-vertical").forEach((container) => {
    container.addEventListener("click", (e) => {
        const botao = e.target.closest(".timeline-card__toggle");
        if (botao) {
            const card = botao.closest(".timeline-card");
            if (card) {
                card.dataset.interagido = "true";
            }
        }
    });
});

window.addEventListener("resize", aoRedimensionar);

// Atualiza o estado visual da linha do tempo conforme zoom e períodos selecionados.
function atualizarLinhaDoTempo() {
    linhaTempo.dataset.zoom = zoomAtual;

    eventosLinhaTempo.forEach((evento) => {
        const nivelEvento = Number(evento.dataset.level);
        const periodoEvento = evento.dataset.period;

        const visivelPorZoom = nivelEvento <= zoomAtual;
        const visivelPorPeriodo = periodosAtivos.size === 0 || periodosAtivos.has(periodoEvento);

        evento.hidden = !(visivelPorZoom && visivelPorPeriodo);
    });

    const textoAtual = textosZoom[zoomAtual];
    const larguraAtual = `${zoomAtual * 50}%`;

    if (rotuloZoom) rotuloZoom.textContent = textoAtual;
    if (barraProgressoZoom) barraProgressoZoom.style.width = larguraAtual;
    if (rotuloZoomFloat) rotuloZoomFloat.textContent = textoAtual;
    if (barraProgressoZoomFloat) barraProgressoZoomFloat.style.width = larguraAtual;
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
    periodosAtivos.clear();
    sincronizarDropdown();
    atualizarLinhaDoTempo();
}

// ── Dropdown multi-seleção de períodos ────────────────────────────────────────

const PERIODOS_DISPONIVEIS = ["x", "millennials", "z"];
// Set de períodos activos; vazio = todos visíveis
let periodosAtivos = new Set();

// Elementos do painel principal
const dropdownEl   = document.getElementById("periodDropdown");
const triggerBtn   = document.getElementById("periodTrigger");
const triggerLabel = document.getElementById("periodTriggerLabel");
const menuEl       = document.getElementById("periodMenu");
const checkAll     = document.getElementById("periodAll");
const checkboxes   = menuEl ? Array.from(menuEl.querySelectorAll("input[type=checkbox]:not(#periodAll)")) : [];

// Elementos da sidebar flutuante
const triggerBtnFloat   = document.getElementById("periodTrigger-float");
const triggerLabelFloat = document.getElementById("periodTriggerLabel-float");
const menuElFloat       = document.getElementById("periodMenu-float");
const checkAllFloat     = document.getElementById("periodAll-float");
const checkboxesFloat   = menuElFloat
    ? Array.from(menuElFloat.querySelectorAll("input[type=checkbox]:not(#periodAll-float)"))
    : [];

const LABELS_PERIODO = {
    x: "Geração X",
    millennials: "Millennials",
    z: "Geração Z"
};

// Abre/fecha o dropdown principal.
function alternarDropdown(forcar) {
    const aberto = forcar !== undefined ? forcar : triggerBtn.getAttribute("aria-expanded") !== "true";
    triggerBtn.setAttribute("aria-expanded", aberto ? "true" : "false");
    menuEl.classList.toggle("period-dropdown__menu--open", aberto);
}

// Abre/fecha o dropdown da sidebar.
function alternarDropdownFloat(forcar) {
    if (!triggerBtnFloat) return;
    const aberto = forcar !== undefined ? forcar : triggerBtnFloat.getAttribute("aria-expanded") !== "true";
    triggerBtnFloat.setAttribute("aria-expanded", aberto ? "true" : "false");
    menuElFloat.classList.toggle("period-dropdown__menu--open", aberto);
}

// Sincroniza o estado dos checkboxes e labels de ambos os painéis com `periodosAtivos`.
function sincronizarDropdown() {
    const tudo = periodosAtivos.size === 0;

    // Painel principal
    checkAll.checked = tudo;
    checkAll.indeterminate = false;
    checkboxes.forEach((cb) => {
        cb.checked = tudo || periodosAtivos.has(cb.value);
    });

    // Sidebar flutuante
    if (checkAllFloat) {
        checkAllFloat.checked = tudo;
        checkAllFloat.indeterminate = false;
    }
    checkboxesFloat.forEach((cb) => {
        cb.checked = tudo || periodosAtivos.has(cb.value);
    });

    // Labels dos triggers
    let label;
    if (tudo) {
        label = "Todas as gerações";
    } else if (periodosAtivos.size === 1) {
        label = LABELS_PERIODO[[...periodosAtivos][0]] || "";
    } else {
        label = `${periodosAtivos.size} gerações selecionadas`;
    }

    if (triggerLabel) triggerLabel.textContent = label;
    if (triggerLabelFloat) triggerLabelFloat.textContent = label;

    // Ajusta zoom mínimo se algum filtro estiver ativo
    if (!tudo && zoomAtual === 0) {
        zoomAtual = 1;
    }
}

// Lida com mudança em checkbox de qualquer painel, recebendo as referências do painel correto.
function lidarComMudancaCheckbox(cb, checkAllRef, checkboxesRef) {
    if (cb === checkAllRef) {
        // "Selecionar todas" marcado → limpa o set (= todos)
        periodosAtivos.clear();
        checkboxesRef.forEach((c) => { c.checked = true; });
        checkAllRef.checked = true;
    } else {
        if (cb.checked) {
            // Marcando um item individual
            periodosAtivos.add(cb.value);
            // Se todos individuais estão marcados, volta ao "todas"
            if (periodosAtivos.size === PERIODOS_DISPONIVEIS.length) {
                periodosAtivos.clear();
            }
        } else {
            // Desmarcando um item individual
            if (periodosAtivos.size === 0) {
                // Estado era "todos" (set vazio) — adiciona todos exceto o desmarcado
                PERIODOS_DISPONIVEIS.forEach((p) => {
                    if (p !== cb.value) {
                        periodosAtivos.add(p);
                    }
                });
            } else {
                periodosAtivos.delete(cb.value);
                // Se o set ficou vazio, volta ao "todos"
                if (periodosAtivos.size === 0) {
                    periodosAtivos.clear();
                }
            }
        }

        checkAllRef.checked = periodosAtivos.size === 0;
    }

    sincronizarDropdown();
    atualizarLinhaDoTempo();
}

// Wiring – painel principal
if (triggerBtn) {
    triggerBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        alternarDropdown();
    });
}

if (menuEl) {
    menuEl.addEventListener("change", (e) => {
        const cb = e.target;
        if (cb.type === "checkbox") {
            lidarComMudancaCheckbox(cb, checkAll, checkboxes);
        }
    });

    // Evita que cliques dentro do menu fechem o dropdown
    menuEl.addEventListener("click", (e) => e.stopPropagation());
}

// Wiring – sidebar flutuante
if (triggerBtnFloat) {
    triggerBtnFloat.addEventListener("click", (e) => {
        e.stopPropagation();
        alternarDropdownFloat();
    });
}

if (menuElFloat) {
    menuElFloat.addEventListener("change", (e) => {
        const cb = e.target;
        if (cb.type === "checkbox") {
            lidarComMudancaCheckbox(cb, checkAllFloat, checkboxesFloat);
        }
    });

    menuElFloat.addEventListener("click", (e) => e.stopPropagation());
}

// Fecha ambos os dropdowns ao clicar fora
document.addEventListener("click", () => {
    alternarDropdown(false);
    alternarDropdownFloat(false);
});

// Fecha com Escape
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        alternarDropdown(false);
        alternarDropdownFloat(false);
        triggerBtn && triggerBtn.focus();
    }
});

// Wiring – botões de zoom (painel principal)
botaoZoomMais.addEventListener("click", aumentarZoom);
botaoZoomMenos.addEventListener("click", diminuirZoom);
botaoReset.addEventListener("click", resetarLinhaDoTempo);

// Wiring – botões de zoom (sidebar flutuante)
if (botaoZoomMaisFloat) botaoZoomMaisFloat.addEventListener("click", aumentarZoom);
if (botaoZoomMenosFloat) botaoZoomMenosFloat.addEventListener("click", diminuirZoom);
if (botaoResetFloat) botaoResetFloat.addEventListener("click", resetarLinhaDoTempo);

// ── Botão toggle + IntersectionObserver ──────────────────────────────────────
const timelineControlsEl = document.querySelector(".timeline-controls");
const floatWrapper  = document.getElementById("timeline-float-controls");
const sidebarEl     = document.getElementById("timeline-sidebar");
const toggleBtn     = document.getElementById("timeline-sidebar-toggle");

function abrirSidebar(aberto) {
    if (!floatWrapper || !toggleBtn) return;
    floatWrapper.classList.toggle("timeline-float-controls--open", aberto);
    toggleBtn.setAttribute("aria-expanded", aberto ? "true" : "false");
    toggleBtn.setAttribute("aria-label", aberto ? "Fechar controles" : "Abrir controles");
}

if (toggleBtn) {
    toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const estaAberto = floatWrapper.classList.contains("timeline-float-controls--open");
        abrirSidebar(!estaAberto);
    });
}

// Fecha o painel ao clicar fora do wrapper
document.addEventListener("click", (e) => {
    if (floatWrapper && !floatWrapper.contains(e.target)) {
        abrirSidebar(false);
    }
});

if (timelineControlsEl && floatWrapper) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const visivel = entry.isIntersecting;
            floatWrapper.classList.toggle("timeline-float-controls--visible", !visivel);
            floatWrapper.setAttribute("aria-hidden", visivel ? "true" : "false");
            // Fecha o painel quando o controle principal voltar à tela
            if (visivel) abrirSidebar(false);
        });
    }, { threshold: 0 });

    observer.observe(timelineControlsEl);
}

atualizarLinhaDoTempo();
inicializarToggleCards();
