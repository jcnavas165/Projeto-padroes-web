const book = document.getElementById("dictionaryBook");

const leftPageTitle = document.getElementById("leftPageTitle");
const rightPageTitle = document.getElementById("rightPageTitle");

const leftPageContent = document.getElementById("leftPageContent");
const rightPageContent = document.getElementById("rightPageContent");

const leftPageNumber = document.getElementById("leftPageNumber");
const rightPageNumber = document.getElementById("rightPageNumber");

const prevPageButton = document.getElementById("prevPage");
const nextPageButton = document.getElementById("nextPage");

const prevPageBottomButton = document.getElementById("prevPageBottom");
const nextPageBottomButton = document.getElementById("nextPageBottom");

const firstPageButton = document.getElementById("firstPage");
const lastPageButton = document.getElementById("lastPage");

const pageIndicator = document.getElementById("pageIndicator");
const totalTerms = document.getElementById("totalTerms");
const currentRange = document.getElementById("currentRange");

const searchInput = document.getElementById("dictionarySearch");

const itemsPerSide = 4;
const itemsPerSpread = itemsPerSide * 2;

let allTerms = [];
let filteredTerms = [];
let currentSpread = 0;
let isAnimating = false;

async function loadDictionary() {
    try {
        const response = await fetch("girias_csv.txt");

        if (!response.ok) {
            throw new Error("Não foi possível carregar o arquivo girias_csv.txt");
        }

        const csvText = await response.text();
        allTerms = parseCSV(csvText);

        allTerms.sort((a, b) => a.giria.localeCompare(b.giria, "pt-BR"));

        filteredTerms = [...allTerms];

        renderBook();
    } catch (error) {
        leftPageContent.innerHTML = `
            <div class="empty-message">
                Não foi possível carregar o arquivo <strong>girias_csv.txt</strong>.
                Verifique se ele está na mesma pasta do HTML e abra o projeto usando um servidor local.
            </div>
        `;

        rightPageContent.innerHTML = `
            <div class="empty-message">
                Dica: use a extensão Live Server no VS Code para testar a página corretamente.
            </div>
        `;

        totalTerms.textContent = "Arquivo não carregado";
        currentRange.textContent = "Sem dados";
        pageIndicator.textContent = "Página 0 de 0";

        updateButtons();
        console.error(error);
    }
}

function parseCSV(csvText) {
    const lines = csvText
        .trim()
        .split(/\r?\n/)
        .filter((line) => line.trim() !== "");

    const dataLines = lines.slice(1);

    return dataLines.map((line) => {
        const columns = splitCSVLine(line);

        return {
            giria: cleanCSVValue(columns[0] || ""),
            significado: cleanCSVValue(columns[1] || "")
        };
    }).filter((item) => item.giria && item.significado);
}

function splitCSVLine(line) {
    const result = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"' && nextChar === '"') {
            current += '"';
            i++;
            continue;
        }

        if (char === '"') {
            insideQuotes = !insideQuotes;
            continue;
        }

        if (char === ";" && !insideQuotes) {
            result.push(current);
            current = "";
            continue;
        }

        current += char;
    }

    result.push(current);

    return result;
}

function cleanCSVValue(value) {
    return value.trim().replace(/^"|"$/g, "");
}

function renderBook() {
    const totalSpreads = getTotalSpreads();

    if (currentSpread > totalSpreads - 1) {
        currentSpread = Math.max(totalSpreads - 1, 0);
    }

    const start = currentSpread * itemsPerSpread;
    const end = start + itemsPerSpread;

    const currentItems = filteredTerms.slice(start, end);
    const leftItems = currentItems.slice(0, itemsPerSide);
    const rightItems = currentItems.slice(itemsPerSide, itemsPerSpread);

    const leftPage = currentSpread * 2 + 1;
    const rightPage = leftPage + 1;

    leftPageTitle.textContent = getPageTitle(leftItems, "Gírias");
    rightPageTitle.textContent = getPageTitle(rightItems, "Significados");

    leftPageContent.innerHTML = renderEntries(leftItems);
    rightPageContent.innerHTML = renderEntries(rightItems);

    leftPageNumber.textContent = leftPage;
    rightPageNumber.textContent = rightPage;

    const visibleStart = filteredTerms.length === 0 ? 0 : start + 1;
    const visibleEnd = Math.min(end, filteredTerms.length);

    totalTerms.textContent = `${filteredTerms.length} termo(s) encontrado(s)`;
    currentRange.textContent = `${visibleStart} - ${visibleEnd} de ${filteredTerms.length}`;

    pageIndicator.textContent = `Página ${currentSpread + 1} de ${totalSpreads || 1}`;

    updateButtons();
}
//consideraçoes : 
function renderEntries(items) {
    if (items.length === 0) {
        return `
            <div class="empty-message">
                Nenhuma gíria encontrada nesta página. 
            </div>
        `;
    }

    return items.map((item) => {
        const tag = getTag(item.giria);

        return `
            <article class="dictionary-entry">
                <h4 class="entry-term">${escapeHTML(item.giria)}</h4>
                <p class="entry-meaning">${escapeHTML(item.significado)}</p>
                <span class="entry-tag ${tag.className}">${tag.text}</span>
            </article>
        `;
    }).join("");
}

function getTag(term) {
    const normalized = term.toLowerCase();

    const brazilianizedPatterns = [
        "ar",
        "ear",
        "izar"
    ];

    const hasBrazilianizedForm = brazilianizedPatterns.some((ending) => {
        return normalized.endsWith(ending);
    });

    const hasSlashBrazilianized = normalized.includes("/ ") || normalized.includes("/");
    const knownBrazilianized = [
        "dropar",
        "flopar",
        "ghostar",
        "shippar",
        "farmar",
        "stalkear",
        "tankar",
        "moggar",
        "viralizar",
    ];

    if (hasBrazilianizedForm || hasSlashBrazilianized || knownBrazilianized.some((word) => normalized.includes(word))) {
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

function getPageTitle(items, fallback) {
    if (items.length === 0) {
        return fallback;
    }

    const firstLetter = items[0].giria.charAt(0).toUpperCase();
    const lastLetter = items[items.length - 1].giria.charAt(0).toUpperCase();

    if (firstLetter === lastLetter) {
        return `Letra ${firstLetter}`;
    }

    return `${firstLetter} - ${lastLetter}`;
}

function updateButtons() {
    const totalSpreads = getTotalSpreads();
    const isFirst = currentSpread === 0;
    const isLast = currentSpread >= totalSpreads - 1 || totalSpreads === 0;

    prevPageButton.disabled = isFirst || isAnimating;
    prevPageBottomButton.disabled = isFirst || isAnimating;
    firstPageButton.disabled = isFirst || isAnimating;

    nextPageButton.disabled = isLast || isAnimating;
    nextPageBottomButton.disabled = isLast || isAnimating;
    lastPageButton.disabled = isLast || isAnimating;
}

function getTotalSpreads() {
    return Math.ceil(filteredTerms.length / itemsPerSpread);
}

function nextPage() {
    if (isAnimating || currentSpread >= getTotalSpreads() - 1) {
        return;
    }

    animatePage("next", () => {
        currentSpread++;
        renderBook();
    });
}

function prevPage() {
    if (isAnimating || currentSpread <= 0) {
        return;
    }

    animatePage("prev", () => {
        currentSpread--;
        renderBook();
    });
}

function goToFirstPage() {
    if (isAnimating || currentSpread === 0) {
        return;
    }

    animatePage("prev", () => {
        currentSpread = 0;
        renderBook();
    });
}

function goToLastPage() {
    const lastSpread = getTotalSpreads() - 1;

    if (isAnimating || currentSpread === lastSpread) {
        return;
    }

    animatePage("next", () => {
        currentSpread = lastSpread;
        renderBook();
    });
}

function animatePage(direction, updateContentCallback) {
    isAnimating = true;
    updateButtons();

    const className = direction === "next" ? "flipping-next" : "flipping-prev";

    book.classList.add(className);

    setTimeout(() => {
        updateContentCallback();
    }, 280);

    setTimeout(() => {
        book.classList.remove(className);
        isAnimating = false;
        updateButtons();
    }, 620);
}

function filterDictionary() {
    const searchTerm = searchInput.value.trim().toLowerCase();

    filteredTerms = allTerms.filter((item) => {
        const giria = item.giria.toLowerCase();
        const significado = item.significado.toLowerCase();

        return giria.includes(searchTerm) || significado.includes(searchTerm);
    });

    currentSpread = 0;
    renderBook();
}

function escapeHTML(text) {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

nextPageButton.addEventListener("click", nextPage);
nextPageBottomButton.addEventListener("click", nextPage);

prevPageButton.addEventListener("click", prevPage);
prevPageBottomButton.addEventListener("click", prevPage);

firstPageButton.addEventListener("click", goToFirstPage);
lastPageButton.addEventListener("click", goToLastPage);

searchInput.addEventListener("input", filterDictionary);

document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
        nextPage();
    }

    if (event.key === "ArrowLeft") {
        prevPage();
    }
});

loadDictionary();
