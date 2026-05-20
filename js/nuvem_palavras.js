/* palavras mockadas*/
const palavrasBase = [
    { word: "like",    weight: 9 },
    { word: "vibe",    weight: 7 },
    { word: "hype",    weight: 6 },
    { word: "cringe",  weight: 4 },
    { word: "farmar",  weight: 3 },
];

const CORES = ["#2E5E3E","#1F3F2B","#E9B949","#4A8C5C","#C49A28","#3D7A52","#D4A820"];

(function () {
    "use strict";

    const canvas        = document.getElementById("wordCloudCanvas");
    const input         = document.getElementById("wordInput");
    const btnAdicionar  = document.getElementById("addWordBtn");
    const tagsContainer = document.getElementById("userTagsContainer");
    if (!canvas) { console.error("canvas não encontrado"); return; }

    canvas.setAttribute("width",  "860");
    canvas.setAttribute("height", "420");

    const ctx = canvas.getContext("2d");

    /* pesosUsuario: chave → peso extra acumulado */
    const pesosUsuario = new Map();

    /* ── PRNG determinístico */
    function hash(str) {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 16777619) >>> 0;
        }
        return h;
    }
    function prng(seed) {
        let s = seed >>> 0;
        return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 4294967296; };
    }

    /* Propriedades visuais fixas por palavra */
    const esteticaCache = new Map();
    function getEstetica(chave) {
        if (esteticaCache.has(chave)) return esteticaCache.get(chave);
        const r = prng(hash(chave));
        const obj = {
            cor:    CORES[Math.floor(r() * CORES.length)],
            angulo: r() < 0.2 ? Math.PI / 2 : 0,
            offset: r(),
        };
        esteticaCache.set(chave, obj);
        return obj;
    }

    /* ── Lista consolidada */
    function listaAtual() {
        const mapa = new Map();
        for (const p of palavrasBase) mapa.set(p.word.toLowerCase(), { word: p.word, weight: p.weight });
        for (const [chave, extra] of pesosUsuario) {
            if (mapa.has(chave)) {
                mapa.get(chave).weight = Math.min(mapa.get(chave).weight + extra, 15);
            } else {
                const display = tagsContainer?.querySelector(`[data-word="${chave}"]`)?.dataset.display || chave;
                mapa.set(chave, { word: display, weight: Math.min(extra, 15) });
            }
        }
        return [...mapa.values()].sort((a, b) => b.weight - a.weight);
    }

    /* ── Posicionamento */
    function calcPx(weight, minW, maxW) {
        const MIN = 14, MAX = 58;
        if (maxW === minW) return (MIN + MAX) / 2;
        return MIN + ((weight - minW) / (maxW - minW)) * (MAX - MIN);
    }

    function colide(a, b) {
        const m = 6;
        return !(a.x + a.w + m <= b.x || b.x + b.w + m <= a.x ||
                 a.y + a.h + m <= b.y || b.y + b.h + m <= a.y);
    }

    function calcularPosicoes(lista) {
        const W = canvas.width, H = canvas.height;
        const pesos = lista.map(i => i.weight);
        const minW  = Math.min(...pesos), maxW = Math.max(...pesos);
        const ocupadas = [];
        const resultado = new Map();

        for (const item of lista) {
            const chave   = item.word.toLowerCase();
            const est     = getEstetica(chave);
            const tamanho = calcPx(item.weight, minW, maxW);

            ctx.font = `bold ${Math.round(tamanho)}px 'Montserrat', Arial, sans-serif`;
            const med  = ctx.measureText(item.word);
            const boxW = est.angulo === 0 ? med.width      : tamanho * 1.1;
            const boxH = est.angulo === 0 ? tamanho * 1.3  : med.width;

            let ok = false;
            for (let t = 0; t < 2000 && !ok; t++) {
                const a  = est.offset * Math.PI * 2 + t * 0.25;
                const r  = t * 2.2;
                const cx = W / 2 + r * Math.cos(a);
                const cy = H / 2 + r * Math.sin(a);
                const c  = { x: cx - boxW / 2, y: cy - boxH / 2, w: boxW, h: boxH };

                if (c.x < 2 || c.y < 2 || c.x + c.w > W - 2 || c.y + c.h > H - 2) continue;
                if (ocupadas.some(o => colide(c, o))) continue;

                resultado.set(chave, { x: cx, y: cy });
                ocupadas.push(c);
                ok = true;
            }
            if (!ok) console.warn(`sem espaço para "${item.word}"`);
        }
        return resultado;
    }

    /* ── Renderização */
    function desenhar() {
        const W = canvas.width, H = canvas.height;
        const lista = listaAtual();
        const pos   = calcularPosicoes(lista);
        const pesos = lista.map(i => i.weight);
        const minW  = Math.min(...pesos), maxW = Math.max(...pesos);

        ctx.clearRect(0, 0, W, H);

        /* Fundo gradiente */
        const g = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)/1.4);
        g.addColorStop(0, "rgba(255,243,208,0.7)");
        g.addColorStop(1, "rgba(221,235,221,0.5)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

        for (const item of lista) {
            const chave = item.word.toLowerCase();
            const p     = pos.get(chave);
            if (!p) continue;

            const est     = getEstetica(chave);
            const tamanho = calcPx(item.weight, minW, maxW);

            ctx.save();
            ctx.translate(p.x, p.y);
            if (est.angulo) ctx.rotate(est.angulo);
            ctx.font         = `bold ${Math.round(tamanho)}px 'Montserrat', Arial, sans-serif`;
            ctx.fillStyle    = est.cor;
            ctx.textAlign    = "center";
            ctx.textBaseline = "middle";
            ctx.shadowColor  = "rgba(0,0,0,0.12)";
            ctx.shadowBlur   = 3;
            ctx.fillText(item.word, 0, 0);
            ctx.restore();
        }
    }

    /* ── Adicionar palavra */
    function adicionarPalavra() {
        if (!input) return;
        const valor = input.value.trim();
        if (!valor) return;
        const chave = valor.toLowerCase();

        if (pesosUsuario.has(chave)) {
            pesosUsuario.set(chave, Math.min(pesosUsuario.get(chave) + 3, 15));

            const tag = tagsContainer?.querySelector(`[data-word="${chave}"]`);
            if (tag) {
                tag.style.outline = "2px solid #E9B949";
                setTimeout(() => { tag.style.outline = ""; }, 600);
            }
        } else {
            const base = palavrasBase.some(p => p.word.toLowerCase() === chave);
            pesosUsuario.set(chave, base ? 3 : 5);
            if (tagsContainer) criarTag(valor, chave);
        }

        desenhar();
        input.value = "";
        input.focus();
    }

    /* ── Tag visual */
    function criarTag(display, chave) {
        const tag = document.createElement("span");
        tag.dataset.word    = chave;
        tag.dataset.display = display;
        tag.textContent     = display;

        const btn = document.createElement("button");
        btn.type        = "button";
        btn.textContent = "×";
        btn.addEventListener("click", () => {
            pesosUsuario.delete(chave);
            tag.remove();
            desenhar();
        });

        tag.appendChild(btn);
        tagsContainer.appendChild(tag);
    }

    if (btnAdicionar) btnAdicionar.addEventListener("click", adicionarPalavra);
    if (input) input.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); adicionarPalavra(); } });

    desenhar();

})();