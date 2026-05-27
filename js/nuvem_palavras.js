const palavrasBase = [
    { word: "like", weight: 9 },
    { word: "vibe", weight: 7 },
    { word: "hype", weight: 6 },
    { word: "cringe", weight: 4 },
    { word: "farmar", weight: 3 }
];

const CORES = ["#2E5E3E", "#1F3F2B", "#E9B949", "#4A8C5C", "#C49A28", "#3D7A52", "#D4A820"];

(function () {
    "use strict";

    const canvas = document.getElementById("wordCloudCanvas");
    const campoPalavra = document.getElementById("wordInput");
    const botaoAdicionar = document.getElementById("addWordBtn");
    const containerTags = document.getElementById("userTagsContainer");

    if (!canvas) {
        console.error("canvas não encontrado");
        return;
    }

    canvas.setAttribute("width", "860");
    canvas.setAttribute("height", "420");

    const contexto = canvas.getContext("2d");
    const pesosUsuario = new Map();
    const cacheEstetica = new Map();

    // Gera um hash numérico determinístico a partir de uma string.
    function gerarHash(texto) {
        let hash = 2166136261 >>> 0;

        for (let i = 0; i < texto.length; i++) {
            hash ^= texto.charCodeAt(i);
            hash = Math.imul(hash, 16777619) >>> 0;
        }

        return hash;
    }

    // Cria um gerador pseudoaleatório determinístico com base na semente.
    function criarGeradorPseudoAleatorio(semente) {
        let estado = semente >>> 0;

        return () => {
            estado = (Math.imul(1664525, estado) + 1013904223) >>> 0;
            return estado / 4294967296;
        };
    }

    // Retorna os atributos visuais fixos de uma palavra para manter consistência entre renders.
    function obterEsteticaPalavra(chave) {
        if (cacheEstetica.has(chave)) {
            return cacheEstetica.get(chave);
        }

        const gerarAleatorio = criarGeradorPseudoAleatorio(gerarHash(chave));
        const estetica = {
            cor: CORES[Math.floor(gerarAleatorio() * CORES.length)],
            angulo: gerarAleatorio() < 0.2 ? Math.PI / 2 : 0,
            offset: gerarAleatorio()
        };

        cacheEstetica.set(chave, estetica);
        return estetica;
    }

    // Consolida palavras-base e termos do usuário em uma lista única ordenada por peso.
    function montarListaPalavras() {
        const mapaPalavras = new Map();

        for (const palavra of palavrasBase) {
            mapaPalavras.set(palavra.word.toLowerCase(), { word: palavra.word, weight: palavra.weight });
        }

        for (const [chave, pesoExtra] of pesosUsuario) {
            if (mapaPalavras.has(chave)) {
                const item = mapaPalavras.get(chave);
                item.weight = Math.min(item.weight + pesoExtra, 15);
                continue;
            }

            const textoTag = containerTags?.querySelector(`[data-word="${chave}"]`)?.dataset.display || chave;
            mapaPalavras.set(chave, { word: textoTag, weight: Math.min(pesoExtra, 15) });
        }

        return [...mapaPalavras.values()].sort((a, b) => b.weight - a.weight);
    }

    // Converte o peso de uma palavra para tamanho de fonte em pixels.
    function calcularTamanhoFontePx(peso, pesoMinimo, pesoMaximo) {
        const tamanhoMinimo = 14;
        const tamanhoMaximo = 58;

        if (pesoMaximo === pesoMinimo) {
            return (tamanhoMinimo + tamanhoMaximo) / 2;
        }

        return tamanhoMinimo + ((peso - pesoMinimo) / (pesoMaximo - pesoMinimo)) * (tamanhoMaximo - tamanhoMinimo);
    }

    // Verifica se duas caixas de palavras se sobrepõem na nuvem.
    function caixasColidem(caixaA, caixaB) {
        const margem = 6;

        return !(caixaA.x + caixaA.w + margem <= caixaB.x ||
            caixaB.x + caixaB.w + margem <= caixaA.x ||
            caixaA.y + caixaA.h + margem <= caixaB.y ||
            caixaB.y + caixaB.h + margem <= caixaA.y);
    }

    // Calcula coordenadas para cada palavra usando uma espiral e evitando colisões.
    function calcularPosicoes(listaPalavras) {
        const largura = canvas.width;
        const altura = canvas.height;
        const pesos = listaPalavras.map((item) => item.weight);
        const pesoMinimo = Math.min(...pesos);
        const pesoMaximo = Math.max(...pesos);
        const caixasOcupadas = [];
        const posicoes = new Map();

        for (const item of listaPalavras) {
            const chave = item.word.toLowerCase();
            const estetica = obterEsteticaPalavra(chave);
            const tamanhoFonte = calcularTamanhoFontePx(item.weight, pesoMinimo, pesoMaximo);

            contexto.font = `bold ${Math.round(tamanhoFonte)}px 'Montserrat', Arial, sans-serif`;

            const medida = contexto.measureText(item.word);
            const larguraCaixa = estetica.angulo === 0 ? medida.width : tamanhoFonte * 1.1;
            const alturaCaixa = estetica.angulo === 0 ? tamanhoFonte * 1.3 : medida.width;

            let encontrouPosicao = false;

            for (let tentativa = 0; tentativa < 2000 && !encontrouPosicao; tentativa++) {
                const angulo = estetica.offset * Math.PI * 2 + tentativa * 0.25;
                const raio = tentativa * 2.2;
                const centroX = largura / 2 + raio * Math.cos(angulo);
                const centroY = altura / 2 + raio * Math.sin(angulo);

                const caixaAtual = {
                    x: centroX - larguraCaixa / 2,
                    y: centroY - alturaCaixa / 2,
                    w: larguraCaixa,
                    h: alturaCaixa
                };

                const foraDoCanvas = caixaAtual.x < 2 ||
                    caixaAtual.y < 2 ||
                    caixaAtual.x + caixaAtual.w > largura - 2 ||
                    caixaAtual.y + caixaAtual.h > altura - 2;

                if (foraDoCanvas) {
                    continue;
                }

                if (caixasOcupadas.some((caixa) => caixasColidem(caixaAtual, caixa))) {
                    continue;
                }

                posicoes.set(chave, { x: centroX, y: centroY });
                caixasOcupadas.push(caixaAtual);
                encontrouPosicao = true;
            }

            if (!encontrouPosicao) {
                console.warn(`sem espaço para "${item.word}"`);
            }
        }

        return posicoes;
    }

    // Renderiza a nuvem completa no canvas com fundo e palavras posicionadas.
    function desenharNuvem() {
        const largura = canvas.width;
        const altura = canvas.height;
        const listaPalavras = montarListaPalavras();
        const posicoes = calcularPosicoes(listaPalavras);
        const pesos = listaPalavras.map((item) => item.weight);
        const pesoMinimo = Math.min(...pesos);
        const pesoMaximo = Math.max(...pesos);

        contexto.clearRect(0, 0, largura, altura);

        const gradiente = contexto.createRadialGradient(
            largura / 2,
            altura / 2,
            0,
            largura / 2,
            altura / 2,
            Math.max(largura, altura) / 1.4
        );

        gradiente.addColorStop(0, "rgba(255,243,208,0.7)");
        gradiente.addColorStop(1, "rgba(221,235,221,0.5)");

        contexto.fillStyle = gradiente;
        contexto.fillRect(0, 0, largura, altura);

        for (const item of listaPalavras) {
            const chave = item.word.toLowerCase();
            const posicao = posicoes.get(chave);

            if (!posicao) {
                continue;
            }

            const estetica = obterEsteticaPalavra(chave);
            const tamanhoFonte = calcularTamanhoFontePx(item.weight, pesoMinimo, pesoMaximo);

            contexto.save();
            contexto.translate(posicao.x, posicao.y);

            if (estetica.angulo) {
                contexto.rotate(estetica.angulo);
            }

            contexto.font = `bold ${Math.round(tamanhoFonte)}px 'Montserrat', Arial, sans-serif`;
            contexto.fillStyle = estetica.cor;
            contexto.textAlign = "center";
            contexto.textBaseline = "middle";
            contexto.shadowColor = "rgba(0,0,0,0.12)";
            contexto.shadowBlur = 3;
            contexto.fillText(item.word, 0, 0);
            contexto.restore();
        }
    }

    // Inclui palavra digitada, ajusta pesos e atualiza a nuvem.
    function adicionarPalavra() {
        if (!campoPalavra) {
            return;
        }

        const valor = campoPalavra.value.trim();

        if (!valor) {
            return;
        }

        const chave = valor.toLowerCase();

        if (pesosUsuario.has(chave)) {
            pesosUsuario.set(chave, Math.min(pesosUsuario.get(chave) + 3, 15));

            const tag = containerTags?.querySelector(`[data-word="${chave}"]`);
            if (tag) {
                tag.style.outline = "2px solid #E9B949";
                setTimeout(() => {
                    tag.style.outline = "";
                }, 600);
            }
        } else {
            const existeNaBase = palavrasBase.some((palavra) => palavra.word.toLowerCase() === chave);
            pesosUsuario.set(chave, existeNaBase ? 3 : 5);

            if (containerTags) {
                criarTagPalavra(valor, chave);
            }
        }

        desenharNuvem();
        campoPalavra.value = "";
        campoPalavra.focus();
    }

    // Cria uma tag de palavra adicionada com botão de remoção.
    function criarTagPalavra(textoExibicao, chave) {
        const tag = document.createElement("span");
        tag.dataset.word = chave;
        tag.dataset.display = textoExibicao;
        tag.textContent = textoExibicao;

        const botaoRemover = document.createElement("button");
        botaoRemover.type = "button";
        botaoRemover.textContent = "×";

        botaoRemover.addEventListener("click", () => {
            pesosUsuario.delete(chave);
            tag.remove();
            desenharNuvem();
        });

        tag.appendChild(botaoRemover);
        containerTags.appendChild(tag);
    }

    // Trata o Enter no campo de texto para adicionar uma palavra.
    function lidarComEnterNoCampo(evento) {
        if (evento.key !== "Enter") {
            return;
        }

        evento.preventDefault();
        adicionarPalavra();
    }

    if (botaoAdicionar) {
        botaoAdicionar.addEventListener("click", adicionarPalavra);
    }

    if (campoPalavra) {
        campoPalavra.addEventListener("keydown", lidarComEnterNoCampo);
    }

    desenharNuvem();
})();