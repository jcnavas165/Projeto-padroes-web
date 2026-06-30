(function () {
    "use strict";

    const hamburger = document.getElementById("nav-hamburger");
    const menu = document.getElementById("nav-menu");
    const overlay = document.getElementById("nav-overlay");

    if (!hamburger || !menu || !overlay) {
        return;
    }

    function abrirMenu() {
        menu.classList.add("nav-open");
        overlay.classList.add("nav-overlay--visible");
        hamburger.setAttribute("aria-expanded", "true");
        hamburger.setAttribute("aria-label", "Fechar menu");
        document.body.style.overflow = "hidden";
    }

    function fecharMenu() {
        menu.classList.remove("nav-open");
        overlay.classList.remove("nav-overlay--visible");
        hamburger.setAttribute("aria-expanded", "false");
        hamburger.setAttribute("aria-label", "Abrir menu");
        document.body.style.overflow = "";
    }

    hamburger.addEventListener("click", function () {
        const estaAberto = menu.classList.contains("nav-open");
        if (estaAberto) {
            fecharMenu();
        } else {
            abrirMenu();
        }
    });

    overlay.addEventListener("click", fecharMenu);

    document.addEventListener("keydown", function (evento) {
        if (evento.key === "Escape" && menu.classList.contains("nav-open")) {
            fecharMenu();
            hamburger.focus();
        }
    });
})();
