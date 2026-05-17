const timeline = document.querySelector(".timeline-vertical");
const timelinePage = document.querySelector(".timeline-page");
const events = document.querySelectorAll(".timeline-event");

const zoomInButton = document.getElementById("zoomIn");
const zoomOutButton = document.getElementById("zoomOut");
const resetButton = document.getElementById("resetTimeline");

const zoomLabel = document.getElementById("zoomLabel");
const zoomProgress = document.getElementById("zoomProgress");

const periodButtons = document.querySelectorAll(".period-btn");

let currentZoom = 0;
let currentPeriod = "all";
let wheelBlocked = false;

const zoomTexts = [
    "Visão geral",
    "Zoom médio: eventos principais",
    "Zoom máximo: detalhes e palavras"
];

function updateTimeline() {
    timeline.dataset.zoom = currentZoom;

    events.forEach((event) => {
        const eventLevel = Number(event.dataset.level);
        const eventPeriod = event.dataset.period;

        const visibleByZoom = eventLevel <= currentZoom;
        const visibleByPeriod = currentPeriod === "all" || eventPeriod === currentPeriod;

        event.hidden = !(visibleByZoom && visibleByPeriod);
    });

    zoomLabel.textContent = zoomTexts[currentZoom];
    zoomProgress.style.width = `${currentZoom * 50}%`;

    periodButtons.forEach((button) => {
        const isActive = button.dataset.period === currentPeriod;
        button.classList.toggle("active", isActive);
    });
}

function zoomIn() {
    if (currentZoom < 2) {
        currentZoom++;
        updateTimeline();
        return true;
    }

    return false;
}

function zoomOut() {
    if (currentZoom > 0) {
        currentZoom--;
        updateTimeline();
        return true;
    }

    return false;
}

zoomInButton.addEventListener("click", () => {
    zoomIn();
});

zoomOutButton.addEventListener("click", () => {
    zoomOut();
});

resetButton.addEventListener("click", () => {
    currentZoom = 0;
    currentPeriod = "all";
    updateTimeline();
});

periodButtons.forEach((button) => {
    button.addEventListener("click", () => {
        currentPeriod = button.dataset.period;

        if (currentPeriod !== "all" && currentZoom === 0) {
            currentZoom = 1;
        }

        updateTimeline();
    });
});

/*
    Zoom com o scroll do mouse.

    Scroll para cima: aumenta o zoom.
    Scroll para baixo: diminui o zoom.

    O preventDefault só acontece quando o zoom realmente muda.
    Assim, quando chegar no zoom máximo ou mínimo, a página continua rolando normalmente.
*/
timeline.addEventListener("wheel", (event) => {
    if (wheelBlocked) {
        event.preventDefault();
        return;
    }

    let zoomChanged = false;

    if (event.deltaY < 0) {
        zoomChanged = zoomIn();
    } else if (event.deltaY > 0) {
        zoomChanged = zoomOut();
    }

    if (zoomChanged) {
        event.preventDefault();

        wheelBlocked = true;

        setTimeout(() => {
            wheelBlocked = false;
        }, 450);
    }
}, { passive: false });

updateTimeline();
