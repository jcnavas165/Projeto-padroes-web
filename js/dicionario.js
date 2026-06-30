const livro = document.getElementById("dictionaryBook");

const tituloPaginaEsquerda = document.getElementById("leftPageTitle");
const tituloPaginaDireita = document.getElementById("rightPageTitle");

const conteudoPaginaEsquerda = document.getElementById("leftPageContent");
const conteudoPaginaDireita = document.getElementById("rightPageContent");

const numeroPaginaEsquerda = document.getElementById("leftPageNumber");
const numeroPaginaDireita = document.getElementById("rightPageNumber");

const botaoPaginaAnteriorTopo = document.getElementById("prevPage");
const botaoProximaPaginaTopo = document.getElementById("nextPage");

const botaoPaginaAnteriorRodape = document.getElementById("prevPageBottom");
const botaoProximaPaginaRodape = document.getElementById("nextPageBottom");

const botaoPrimeiraPagina = document.getElementById("firstPage");
const botaoUltimaPagina = document.getElementById("lastPage");

const indicadorPagina = document.getElementById("pageIndicator");
const totalTermos = document.getElementById("totalTerms");
const faixaAtual = document.getElementById("currentRange");

const campoBusca = document.getElementById("dictionarySearch");

// Elementos do menu flutuante
const campoFlutuante         = document.getElementById("dictionarySearch-float");
const indicadorPaginaFloat   = document.getElementById("pageIndicator-float");
const botaoPrimeiraPaginaFloat = document.getElementById("firstPage-float");
const botaoUltimaPaginaFloat   = document.getElementById("lastPage-float");
const botaoPrevFloat           = document.getElementById("prevPage-float");
const botaoNextFloat           = document.getElementById("nextPage-float");

const itensPorLado = 4;
const itensPorAbertura = itensPorLado * 2;

let termosCompletos = [];
let termosFiltrados = [];
let aberturaAtual = 0;
let animandoTroca = false;

// Detecta viewport mobile (igual ao breakpoint do CSS).
function ehMobileDic() {
    return window.matchMedia("(max-width: 800px)").matches;
}

// Retorna quantos itens cabem por "abertura" conforme viewport.
function itensPorAberturaEfetivo() {
    return ehMobileDic() ? itensPorLado : itensPorAbertura;
}

// Carrega o CSV, prepara os termos e inicia a renderização do livro.
async function carregarDicionario() {
    try {
        const resposta = await fetch("/js/girias_csv.txt");

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar o arquivo girias_csv.txt");
        }

        const textoCsv = await resposta.text();
        termosCompletos = converterCsvParaTermos(textoCsv);
        termosCompletos.sort((a, b) => a.giria.localeCompare(b.giria, "pt-BR"));

        termosFiltrados = [...termosCompletos];
        renderizarLivro();
    } catch (erro) {
        mostrarErroDeCarregamento();
        console.error(erro);
    }
}

// Exibe mensagens de fallback quando o arquivo de gírias não pode ser lido.
function mostrarErroDeCarregamento() {
    conteudoPaginaEsquerda.innerHTML = `
        <div class="empty-message">
            Não foi possível carregar o arquivo <strong>girias_csv.txt</strong>.
            Verifique se ele está na mesma pasta do HTML e abra o projeto usando um servidor local.
        </div>
    `;

    conteudoPaginaDireita.innerHTML = `
        <div class="empty-message">
            Dica: use a extensão Live Server no VS Code para testar a página corretamente.
        </div>
    `;

    totalTermos.textContent = "Arquivo não carregado";
    faixaAtual.textContent = "Sem dados";
    indicadorPagina.textContent = "Página 0 de 0";
    atualizarBotoes();
}

// Converte o conteúdo CSV em uma lista de termos válidos.
function converterCsvParaTermos(textoCsv) {
    const linhas = textoCsv
        .trim()
        .split(/\r?\n/)
        .filter((linha) => linha.trim() !== "");

    const linhasComDados = linhas.slice(1);

    return linhasComDados
        .map((linha) => {
            const colunas = separarColunasCsv(linha);

            return {
                giria: limparValorCsv(colunas[0] || ""),
                significado: limparValorCsv(colunas[1] || "")
            };
        })
        .filter((item) => item.giria && item.significado);
}

// Separa uma linha CSV respeitando aspas e ponto e vírgula internos.
function separarColunasCsv(linha) {
    const resultado = [];
    let atual = "";
    let dentroDeAspas = false;

    for (let i = 0; i < linha.length; i++) {
        const caractere = linha[i];
        const proximo = linha[i + 1];

        if (caractere === '"' && proximo === '"') {
            atual += '"';
            i++;
            continue;
        }

        if (caractere === '"') {
            dentroDeAspas = !dentroDeAspas;
            continue;
        }

        if (caractere === ";" && !dentroDeAspas) {
            resultado.push(atual);
            atual = "";
            continue;
        }

        atual += caractere;
    }

    resultado.push(atual);
    return resultado;
}

// Limpa espaços e aspas excedentes do valor vindo do CSV.
function limparValorCsv(valor) {
    return valor.trim().replace(/^"|"$/g, "");
}

// Renderiza as páginas visíveis e atualiza estado da navegação.
function renderizarLivro() {
    const mobile = ehMobileDic();
    const efetivo = itensPorAberturaEfetivo();
    const totalAberturas = obterTotalAberturas();

    if (aberturaAtual > totalAberturas - 1) {
        aberturaAtual = Math.max(totalAberturas - 1, 0);
    }

    const indiceInicial = aberturaAtual * efetivo;
    const indiceFinal = indiceInicial + efetivo;

    const itensVisiveis = termosFiltrados.slice(indiceInicial, indiceFinal);
    const itensEsquerda = mobile ? itensVisiveis : itensVisiveis.slice(0, itensPorLado);
    const itensDireita  = mobile ? [] : itensVisiveis.slice(itensPorLado, itensPorAbertura);

    const paginaEsquerda = mobile ? aberturaAtual + 1 : aberturaAtual * 2 + 1;
    const paginaDireita  = paginaEsquerda + 1;

    tituloPaginaEsquerda.textContent = obterTituloPagina(itensEsquerda, "Gírias");
    tituloPaginaDireita.textContent  = obterTituloPagina(itensDireita, "Significados");

    conteudoPaginaEsquerda.innerHTML = renderizarEntradas(itensEsquerda);
    conteudoPaginaDireita.innerHTML  = renderizarEntradas(itensDireita);

    numeroPaginaEsquerda.textContent = paginaEsquerda;
    numeroPaginaDireita.textContent  = paginaDireita;

    const inicioVisivel = termosFiltrados.length === 0 ? 0 : indiceInicial + 1;
    const fimVisivel    = Math.min(indiceFinal, termosFiltrados.length);

    totalTermos.textContent    = `${termosFiltrados.length} termo(s) encontrado(s)`;
    faixaAtual.textContent     = `${inicioVisivel} - ${fimVisivel} de ${termosFiltrados.length}`;
    indicadorPagina.textContent = `Página ${aberturaAtual + 1} de ${totalAberturas || 1}`;

    if (indicadorPaginaFloat) {
        indicadorPaginaFloat.textContent = `${aberturaAtual + 1}/${totalAberturas || 1}`;
    }
    if (campoFlutuante) {
        campoFlutuante.value = campoBusca.value;
    }

    atualizarBotoes();
}

// Monta o HTML de cada item exibido na página atual.
function renderizarEntradas(itens) {
    if (itens.length === 0) {
        return `
            <div class="empty-message">
                Nenhuma gíria encontrada nesta página.
            </div>
        `;
    }

    return itens
        .map((item) => {
            const tag = obterTagTermo(item.giria);

            return `
                <article class="dictionary-entry">
                    <h4 class="entry-term">${escaparHtml(item.giria)}</h4>
                    <p class="entry-meaning">${escaparHtml(item.significado)}</p>
                    <span class="entry-tag ${tag.className}">${tag.text}</span>
                </article>
            `;
        })
        .join("");
}

// Define a etiqueta visual do termo com base em padrões de abrasileiramento.
function obterTagTermo(termo) {
    const termoNormalizado = termo.toLowerCase();
    const finaisAbrasileirados = ["ar", "ear", "izar"];
    const possuiFinalAbrasileirado = finaisAbrasileirados.some((final) => termoNormalizado.endsWith(final));
    const possuiBarra = termoNormalizado.includes("/ ") || termoNormalizado.includes("/");
    const listaConhecida = [
        "dropar",
        "flopar",
        "ghostar",
        "shippar",
        "farmar",
        "stalkear",
        "tankar",
        "moggar",
        "viralizar"
    ];

    if (possuiFinalAbrasileirado || possuiBarra || listaConhecida.some((palavra) => termoNormalizado.includes(palavra))) {
        return {
            text: "forma abrasileirada",
            className: "brazilianized"
        };
    }

    return {
        text: "empréstimo linguístico",
        className: ""
    };
}

// Gera o título da página com intervalo de letras visível.
function obterTituloPagina(itens, tituloPadrao) {
    if (itens.length === 0) {
        return tituloPadrao;
    }

    const primeiraLetra = itens[0].giria.charAt(0).toUpperCase();
    const ultimaLetra = itens[itens.length - 1].giria.charAt(0).toUpperCase();

    if (primeiraLetra === ultimaLetra) {
        return `Letra ${primeiraLetra}`;
    }

    return `${primeiraLetra} - ${ultimaLetra}`;
}

// Habilita e desabilita botões conforme posição atual e animação.
function atualizarBotoes() {
    const totalAberturas = obterTotalAberturas();
    const estaNoInicio = aberturaAtual === 0;
    const estaNoFim = aberturaAtual >= totalAberturas - 1 || totalAberturas === 0;

    botaoPaginaAnteriorTopo.disabled    = estaNoInicio || animandoTroca;
    botaoPaginaAnteriorRodape.disabled  = estaNoInicio || animandoTroca;
    botaoPrimeiraPagina.disabled        = estaNoInicio || animandoTroca;

    botaoProximaPaginaTopo.disabled     = estaNoFim || animandoTroca;
    botaoProximaPaginaRodape.disabled   = estaNoFim || animandoTroca;
    botaoUltimaPagina.disabled          = estaNoFim || animandoTroca;

    if (botaoPrimeiraPaginaFloat) botaoPrimeiraPaginaFloat.disabled = estaNoInicio || animandoTroca;
    if (botaoPrevFloat)           botaoPrevFloat.disabled           = estaNoInicio || animandoTroca;
    if (botaoNextFloat)           botaoNextFloat.disabled           = estaNoFim    || animandoTroca;
    if (botaoUltimaPaginaFloat)   botaoUltimaPaginaFloat.disabled   = estaNoFim    || animandoTroca;
}

// Calcula quantas aberturas existem na listagem atual (considera viewport).
function obterTotalAberturas() {
    return Math.ceil(termosFiltrados.length / itensPorAberturaEfetivo());
}

// Avança uma abertura do livro quando possível.
function irParaProximaPagina() {
    if (animandoTroca || aberturaAtual >= obterTotalAberturas() - 1) {
        return;
    }

    animarTrocaPagina("next", () => {
        aberturaAtual++;
        renderizarLivro();
    });
}

// Retorna uma abertura do livro quando possível.
function irParaPaginaAnterior() {
    if (animandoTroca || aberturaAtual <= 0) {
        return;
    }

    animarTrocaPagina("prev", () => {
        aberturaAtual--;
        renderizarLivro();
    });
}

// Navega para a primeira abertura do dicionário.
function irParaPrimeiraPagina() {
    if (animandoTroca || aberturaAtual === 0) {
        return;
    }

    animarTrocaPagina("prev", () => {
        aberturaAtual = 0;
        renderizarLivro();
    });
}

// Navega para a última abertura disponível após filtro.
function irParaUltimaPagina() {
    const ultimaAbertura = obterTotalAberturas() - 1;

    if (animandoTroca || aberturaAtual === ultimaAbertura) {
        return;
    }

    animarTrocaPagina("next", () => {
        aberturaAtual = ultimaAbertura;
        renderizarLivro();
    });
}

// Executa a animação de virar página e sincroniza os estados.
function animarTrocaPagina(direcao, aoAtualizarConteudo) {
    animandoTroca = true;
    atualizarBotoes();

    const nomeClasse = direcao === "next" ? "flipping-next" : "flipping-prev";
    livro.classList.add(nomeClasse);

    setTimeout(() => {
        aoAtualizarConteudo();
    }, 280);

    setTimeout(() => {
        livro.classList.remove(nomeClasse);
        animandoTroca = false;
        atualizarBotoes();
    }, 620);
}

// Filtra os termos por gíria ou significado conforme texto digitado.
function filtrarDicionario() {
    const termoBusca = campoBusca.value.trim().toLowerCase();

    termosFiltrados = termosCompletos.filter((item) => {
        const giriaNormalizada = item.giria.toLowerCase();
        const significadoNormalizado = item.significado.toLowerCase();

        return giriaNormalizada.includes(termoBusca) || significadoNormalizado.includes(termoBusca);
    });

    aberturaAtual = 0;
    renderizarLivro();
}

// Escapa conteúdo textual para impedir injeção de HTML nas entradas.
function escaparHtml(texto) {
    return texto
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// Trata atalhos de teclado para avançar e voltar páginas.
function lidarComAtalhosTeclado(evento) {
    if (evento.key === "ArrowRight") {
        irParaProximaPagina();
    }

    if (evento.key === "ArrowLeft") {
        irParaPaginaAnterior();
    }
}

botaoProximaPaginaTopo.addEventListener("click", irParaProximaPagina);
botaoProximaPaginaRodape.addEventListener("click", irParaProximaPagina);

botaoPaginaAnteriorTopo.addEventListener("click", irParaPaginaAnterior);
botaoPaginaAnteriorRodape.addEventListener("click", irParaPaginaAnterior);

botaoPrimeiraPagina.addEventListener("click", irParaPrimeiraPagina);
botaoUltimaPagina.addEventListener("click", irParaUltimaPagina);

campoBusca.addEventListener("input", filtrarDicionario);
document.addEventListener("keydown", lidarComAtalhosTeclado);

// ── Swipe para navegar páginas ────────────────────────────────────────────────
let swipeStartX = null;
let swipeStartY = null;
const SWIPE_MIN_X = 50;   // distância mínima horizontal para contar como swipe
const SWIPE_MAX_Y = 80;   // desvio vertical máximo (evita confundir com scroll)

livro.addEventListener("touchstart", (e) => {
    const t = e.changedTouches[0];
    swipeStartX = t.clientX;
    swipeStartY = t.clientY;
}, { passive: true });

livro.addEventListener("touchend", (e) => {
    if (swipeStartX === null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - swipeStartX;
    const dy = Math.abs(t.clientY - swipeStartY);
    swipeStartX = null;
    swipeStartY = null;

    if (Math.abs(dx) < SWIPE_MIN_X || dy > SWIPE_MAX_Y) return;
    if (dx < 0) irParaProximaPagina();
    else        irParaPaginaAnterior();
}, { passive: true });

// Re-renderiza ao redimensionar para ajustar modo mobile/desktop.
window.addEventListener("resize", () => renderizarLivro());

// ── Menu flutuante ────────────────────────────────────────────────────────────
const dictFloatWrapper = document.getElementById("dict-float-controls");
const dictToggleBtn    = document.getElementById("dict-sidebar-toggle");

function abrirDictSidebar(aberto) {
    if (!dictFloatWrapper || !dictToggleBtn) return;
    dictFloatWrapper.classList.toggle("dict-float-controls--open", aberto);
    dictToggleBtn.setAttribute("aria-expanded", aberto ? "true" : "false");
    dictToggleBtn.setAttribute("aria-label", aberto ? "Fechar controles" : "Abrir controles");
}

if (dictToggleBtn) {
    dictToggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const aberto = dictFloatWrapper.classList.contains("dict-float-controls--open");
        abrirDictSidebar(!aberto);
    });
}

// Fecha ao clicar fora do wrapper
document.addEventListener("click", (e) => {
    if (dictFloatWrapper && !dictFloatWrapper.contains(e.target)) {
        abrirDictSidebar(false);
    }
});

// Busca flutuante — sincroniza com o campo principal
if (campoFlutuante) {
    campoFlutuante.addEventListener("input", () => {
        campoBusca.value = campoFlutuante.value;
        filtrarDicionario();
    });
}

// Navegação flutuante
if (botaoPrimeiraPaginaFloat) botaoPrimeiraPaginaFloat.addEventListener("click", irParaPrimeiraPagina);
if (botaoPrevFloat)           botaoPrevFloat.addEventListener("click", irParaPaginaAnterior);
if (botaoNextFloat)           botaoNextFloat.addEventListener("click", irParaProximaPagina);
if (botaoUltimaPaginaFloat)   botaoUltimaPaginaFloat.addEventListener("click", irParaUltimaPagina);

// Mostra/oculta o wrapper quando .dictionary-tools entra ou sai da tela
const dictToolsEl = document.querySelector(".dictionary-tools");
if (dictToolsEl && dictFloatWrapper) {
    const dictObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const visivel = entry.isIntersecting;
            dictFloatWrapper.classList.toggle("dict-float-controls--visible", !visivel);
            dictFloatWrapper.setAttribute("aria-hidden", visivel ? "true" : "false");
            if (visivel) abrirDictSidebar(false);
        });
    }, { threshold: 0 });

    dictObserver.observe(dictToolsEl);
}

carregarDicionario();
