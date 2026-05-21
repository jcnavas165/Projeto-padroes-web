const perguntas = [
    {
        pergunta: "O que significa a gíria 'red flag' no contexto das redes sociais?",
        opcoes: [
            "Sinal de alerta sobre algo tóxico ou problemático",
            "Conquista especial em um jogo online",
            "Foto ou vídeo que viralizou na internet",
            "Estilo visual com cores vibrantes e chamativas"
        ],
        resposta: 0
    },
    {
        pergunta: "Quando alguém diz que sofreu 'ghosting', o que aconteceu?",
        opcoes: [
            "Recebeu muitos elogios de uma vez",
            "Teve seu perfil hackeado nas redes sociais",
            "Alguém sumiu sem explicação e parou de responder",
            "Foi exposto publicamente com informações falsas"
        ],
        resposta: 2
    }
];


let indexAtual   = 0;
let respostas    = [];
let confirmadas  = [];

for (let i = 0; i < perguntas.length; i++) {
    respostas.push(null);
    confirmadas.push(false);
}


function renderizar() {
    const p = perguntas[indexAtual];

    document.getElementById('contador').textContent =
        (indexAtual + 1) + ' / ' + perguntas.length;

    document.getElementById('texto-pergunta').textContent = p.pergunta;

    const lista = document.getElementById('lista-opcoes');
    lista.innerHTML = '';

    p.opcoes.forEach(function(texto, i) {
        const li = document.createElement('li');
        li.classList.add('quiz-opcao');
        li.textContent = texto;

        if (respostas[indexAtual] === i) {
            li.classList.add('selecionada');
        }

        if (confirmadas[indexAtual]) {
            li.classList.add('bloqueada');
            if (i === p.resposta) {
                li.classList.add('correta');
            } else if (respostas[indexAtual] === i) {
                li.classList.add('errada');
            }
        }

        li.addEventListener('click', function() {
            if (!confirmadas[indexAtual]) {
                respostas[indexAtual] = i;
                renderizar();
            }
        });

        lista.appendChild(li);
    });

    const btnConfirmar = document.getElementById('btn-confirmar');
    if (confirmadas[indexAtual]) {
        btnConfirmar.textContent = '✓ Confirmado';
        btnConfirmar.disabled = true;
    } else {
        btnConfirmar.textContent = 'Confirmar';
        btnConfirmar.disabled = false;
    }

    document.getElementById('btn-anterior').disabled = (indexAtual === 0);

    const btnProxima = document.getElementById('btn-proxima');
    if (indexAtual === perguntas.length - 1) {
        btnProxima.textContent = 'Ver resultado →';
    } else {
        btnProxima.textContent = 'Próxima →';
    }
}


function confirmar() {
    if (respostas[indexAtual] === null) {
        alert('Selecione uma alternativa antes de confirmar!');
        return;
    }
    confirmadas[indexAtual] = true;
    renderizar();
}


function irPara(direcao) {
    const novoIndex = indexAtual + direcao;

    if (novoIndex >= perguntas.length) {
        mostrarResultado();
        return;
    }

    if (novoIndex < 0) return;

    indexAtual = novoIndex;
    renderizar();
}

function mostrarResultado() {
    let acertos = 0;
    for (let i = 0; i < perguntas.length; i++) {
        if (respostas[i] === perguntas[i].resposta) {
            acertos++;
        }
    }

    document.getElementById('tela-pergunta').style.display  = 'none';
    document.getElementById('tela-resultado').style.display = 'flex';
    document.getElementById('contador').textContent = 'Resultado';

    const emoji  = document.getElementById('resultado-emoji');
    const texto  = document.getElementById('resultado-texto');
    const pontos = document.getElementById('resultado-pontos');

    pontos.textContent = acertos + ' de ' + perguntas.length + ' acertos';

    if (acertos === perguntas.length) {
        texto.textContent = 'Perfeito! Você domina o vocabulário da internet!';
    } else if (acertos >= 1) {
        texto.textContent = 'Quase lá! Consulte o Dicionário de Gírias e tente novamente.';
    } else {
        
        texto.textContent = 'Que tal dar uma olhada no Dicionário de Gírias antes de tentar de novo?';
    }

    document.getElementById('btn-anterior').style.display  = 'none';
    document.getElementById('btn-confirmar').style.display = 'none';
    document.getElementById('btn-proxima').textContent     = ' Tentar novamente';
    document.getElementById('btn-proxima').onclick         = reiniciar;
}

function reiniciar() {
    indexAtual = 0;

    for (let i = 0; i < perguntas.length; i++) {
        respostas[i]   = null;
        confirmadas[i] = false;
    }

    document.getElementById('tela-pergunta').style.display  = '';
    document.getElementById('tela-resultado').style.display = 'none';

    document.getElementById('btn-anterior').style.display  = '';
    document.getElementById('btn-confirmar').style.display = '';
    document.getElementById('btn-proxima').textContent     = 'Próxima →';
    document.getElementById('btn-proxima').onclick         = function() { irPara(1); };

    renderizar();
}

renderizar();