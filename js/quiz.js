//Configuração
const CSV_PATH = '../js/girias_csv.txt';
const NUM_PERGUNTAS = 5;
const NUM_OPCOES = 4;

//Estado do quiz
let todasGirias = [];
let perguntas   = [];
let indexAtual  = 0;
let respostas   = [];
let confirmadas = [];


//Carregamento do CSV

function parseLinhaCSV(linha) {
    const campos = [];
    let campoAtual = '';
    let dentroDeAspas = false;

    for (let i = 0; i < linha.length; i++) {
        const char = linha[i];

        if (char === '"') {
            dentroDeAspas = !dentroDeAspas;
            continue;
        }

        if (char === ';' && !dentroDeAspas) {
            campos.push(campoAtual);
            campoAtual = '';
            continue;
        }

        campoAtual += char;
    }
    campos.push(campoAtual);
    return campos;
}

async function carregarGirias() {
    const resposta = await fetch(CSV_PATH);

    if (!resposta.ok) {
        throw new Error('Não foi possível carregar ' + CSV_PATH);
    }

    const texto  = await resposta.text();
    const linhas = texto.trim().split('\n').filter(function(l) {
        return l.trim() !== '';
    });

    linhas.shift();

    return linhas.map(function(linha) {
        const campos = parseLinhaCSV(linha.trim());
        return {
            giria: campos[0].trim(),
            significado: campos[1].trim()
        };
    });
}


//geração das perguntas aleatórias

function embaralhar(array) {
    const copia = array.slice();
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = copia[i];
        copia[i] = copia[j];
        copia[j] = tmp;
    }
    return copia;
}

function gerarPerguntas(girias) {
    const selecionadas = embaralhar(girias).slice(0, NUM_PERGUNTAS);

    return selecionadas.map(function(item) {
        const formatoInvertido = Math.random() < 0.5;

        const pool = girias.filter(function(g) {
            return g.giria !== item.giria;
        });
        const distratores = embaralhar(pool).slice(0, NUM_OPCOES - 1);

        const respostaCorreta = formatoInvertido ? item.giria : item.significado;

        const opcoes = distratores.map(function(d) {
            return formatoInvertido ? d.giria : d.significado;
        });
        opcoes.push(respostaCorreta);

        const opcoesEmbaralhadas = embaralhar(opcoes);

        return {
            pergunta: formatoInvertido
                ? 'Qual gíria tem o seguinte significado: "' + item.significado + '"?'
                : "O que significa a gíria '" + item.giria + "'?",
            opcoes: opcoesEmbaralhadas,
            resposta: opcoesEmbaralhadas.indexOf(respostaCorreta)
        };
    });
}


//Renderização

function renderizar() {
    const p = perguntas[indexAtual];

    document.getElementById('contador').textContent =
        (indexAtual + 1) + ' / ' + perguntas.length;

    document.getElementById('texto-pergunta').textContent = p.pergunta;

    const lista = document.getElementById('lista-opcoes');
    lista.innerHTML = '';

    p.opcoes.forEach(function(texto, i) {
        const li  = document.createElement('li');
        const btn = document.createElement('button');

        btn.type = 'button';
        btn.classList.add('quiz-opcao');
        btn.textContent = texto;

        if (respostas[indexAtual] === i) {
            btn.classList.add('selecionada');
        }

        if (confirmadas[indexAtual]) {
            btn.classList.add('bloqueada');
            btn.disabled = true;

            if (i === p.resposta) {
                btn.classList.add('correta');
            } else if (respostas[indexAtual] === i) {
                btn.classList.add('errada');
            }
        }

        btn.addEventListener('click', function() {
            if (!confirmadas[indexAtual]) {
                respostas[indexAtual] = i;
                renderizar();
            }
        });

        li.appendChild(btn);
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
    document.getElementById('btn-proxima').textContent     = 'Tentar novamente';
    document.getElementById('btn-proxima').onclick         = reiniciar;
}


//Inicialização / reinício

async function iniciarQuiz() {
    document.getElementById('texto-pergunta').textContent = 'Carregando perguntas...';
    document.getElementById('lista-opcoes').innerHTML = '';

    try {
        if (todasGirias.length === 0) {
            todasGirias = await carregarGirias();
        }

        perguntas   = gerarPerguntas(todasGirias);
        respostas   = perguntas.map(function() { return null; });
        confirmadas = perguntas.map(function() { return false; });
        indexAtual  = 0;

        document.getElementById('tela-pergunta').style.display  = '';
        document.getElementById('tela-resultado').style.display = 'none';

        document.getElementById('btn-anterior').style.display  = '';
        document.getElementById('btn-confirmar').style.display = '';
        document.getElementById('btn-proxima').textContent     = 'Próxima →';
        document.getElementById('btn-proxima').onclick         = function() { irPara(1); };

        renderizar();
    } catch (erro) {
        document.getElementById('texto-pergunta').textContent =
            'Erro ao carregar as perguntas. Verifique se "' + CSV_PATH + '" está no caminho correto.';
        console.error(erro);
    }
}

function reiniciar() {
    iniciarQuiz();
}

iniciarQuiz();