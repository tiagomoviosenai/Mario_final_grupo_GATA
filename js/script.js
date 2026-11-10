document.addEventListener('DOMContentLoaded', () => {
    // Elementos do jogo
    const fazendeiro = document.querySelector('.personagem');
    const toco = document.querySelector('.obstaculo');

    const plusFive = document.getElementById('plus-five');
    const coinsDisplay = document.getElementById('coins-display');
    const scoreDisplay = document.getElementById('score-display');
    const levelDisplay = document.getElementById('level-display');
    const livesDisplay = document.getElementById('lives-display');

    const gameBoard = document.getElementById('game-board');
    const lindo = document.getElementById('lindo');
    const hudPlayerName = document.getElementById('hud-player-name');
    const jumpTip = document.getElementById('jump-tip');

    // Fundo com parallax: faixa de 4 imagens (normal / espelhada) que desliza sozinha
    const fundoParallax = document.createElement('div');
    fundoParallax.id = 'fundo-parallax';

    for (let i = 0; i < 4; i++) {
    const tile = document.createElement('div');
    tile.className = 'parallax-img' + (i % 2 ? ' espelhada' : '');
    fundoParallax.appendChild(tile);
    }

gameBoard.prepend(fundoParallax);

    // Modais
    const startModal = document.getElementById('start-modal');
    const startForm = document.getElementById('start-form');
    const playerInput = document.getElementById('player-input');

    const gameoverModal = document.getElementById('gameover-modal');
    const finalScoreValue = document.getElementById('final-score-value');
    const saveStatusMsg = document.getElementById('save-status-msg');
    const rankingBody = document.getElementById('ranking-body');
    const btnRestart = document.getElementById('btn-restart');
    const btnChangePlayer = document.getElementById('btn-change-player');

    // Sobre nós
    const btnAbout = document.getElementById('btn-about');
    const aboutModal = document.getElementById('about-modal');
    const btnCloseAbout = document.getElementById('btn-close-about');

    // Escolha de personagem
    const btnChooseCharacter = document.getElementById('btn-choose-character');
    const characterSelected = document.getElementById('character-selected');
    const characterModal = document.getElementById('character-modal');
    const characterGrid = document.getElementById('character-grid');
    const btnStartCharacter = document.getElementById('btn-start-character');

    // Cada personagem tem seu próprio cenário (claro e escuro) e obstáculo
    const ALL_CHARACTERS = [
        {
            id: 'sg',
            nome: 'Abelha',
            tamanho: 130,
            img: 'assets/img_sg/personagem_sg.gif',
            fundo: 'assets/img_sg/fundo_sg.png',
            fundoEscuro: 'assets/img_sg/fundo_s_sg.png',
            obstaculo: 'assets/img_sg/obt_sg.png',
            lindo: 'assets/img_sg/lindo_sg.gif',
            chao: 0
        },
        {
            id: 'tg',
            nome: 'Fazendeiro',
            tamanho: 130,
            img: 'assets/img_tg/personagem_tg.gif',
            fundo: 'assets/img_tg/fundo_tg.jpg',
            fundoEscuro: 'assets/img_tg/fundo_s_tg.png',
            obstaculo: 'assets/img_tg/obt_tg.png',
            lindo: 'assets/img_tg/lindo_tg.gif',
            chao: 70
        },
        {
            id: 'gus',
            nome: 'Sonic',
            tamanho: 150,
            img: 'assets/img_gus/personagem_gus.gif',
            fundo: 'assets/img_gus/fundo_gus.jpg',
            fundoEscuro: 'assets/img_gus/fundo_s_gus.jpg',
            obstaculo: 'assets/img_gus/obt_gus.png',
            lindo: 'assets/img_gus/lindo_gus.gif',
            chao: 70
        }
    ];

   

    // Reinicia a animação de um GIF (o parâmetro novo força o navegador a recarregar)
    function gifFresco(src) {
        return `${src}?r=${Date.now()}`;
    }

    // Pré-carrega cenários e obstáculos (os GIFs ficam de fora para não terminarem a animação antes da hora)
    ALL_CHARACTERS.forEach(c => {
        [c.fundo, c.fundoEscuro, c.obstaculo].filter(Boolean).forEach(src => {
            const im = new Image();
            im.src = src;
        });
    });

    let selectedCharacter = ALL_CHARACTERS.find(
        c => c.id === localStorage.getItem('jump_ti_character')
    ) || ALL_CHARACTERS[0];

    const NIVEIS_POR_FUNDO = 5;

    let currentPlayer = '';
    let score = 0;
    let coins = 0;
    let isPlaying = false;

    // Vidas
    const VIDAS_INICIAIS = 3;
    const TEMPO_INVULNERAVEL = 1500;
    const MAX_VIDAS = 4;               // ← limite de vidas ao mesmo tempo
    const NIVEIS_POR_CORACAO = 5;     // ← a cada quantos níveis aparece a vida extra
    let lives = VIDAS_INICIAIS;
    let invulneravel = false;
    let invulneravelTimeout = null;
    let blinkInterval = null;

    let gameLoop = null;
    let scoreLoop = null;

    // Velocidade e nível
    // Quanto MENOR o número, mais RÁPIDO o jogo (tempo em segundos que o obstáculo leva para cruzar a tela)
    const VELOCIDADE_INICIAL = 2.0;     // começa um pouco mais rápido que o original (2.5)
    const REDUCAO_POR_NIVEL = 0.15;     // quanto acelera a cada nível (pequeno = aumento gradual)
    const VELOCIDADE_MAXIMA = 0.3;      // limite (a mais rápida possível)

    let currentSpeed = VELOCIDADE_INICIAL;
    let currentLevel = 1;
    let levelMessageTimeout = null;
    // Tempo do alerta de nível (mensagem + pisca vermelho + obstáculo e moedas sumidos)
    const TEMPO_ALERTA = 2000;

    let obstaculoOculto = false;
    let moedasOcultas = false;
    let alertaTimeout = null;

    // Mensagem de subida de nível
    const levelMessage = document.createElement('div');
    levelMessage.id = 'level-up-message';

    Object.assign(levelMessage.style, {
        fontFamily: "'Press Start 2P', monospace",
        lineHeight: '1.5',
        position: 'absolute',
        top: '25%',
        left: '50%',
        transform: 'translate(-50%, -50%) scale(0.8)',
        padding: '14px 22px',
        background: 'rgba(5, 3, 15, 0.9)',
        color: '#ff2600',
        border: '3px solid #ff4d4d',
        borderRadius: '0',
        fontSize: 'clamp(12px, 2.5vw, 22px)',
        fontWeight: '400',
        textAlign: 'center',
        textShadow: '2px 2px 0 #9c251d, 0 0 12px #ff1100',
        zIndex: '1000',
        pointerEvents: 'none',
        opacity: '0',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        whiteSpace: 'nowrap'
    });

    gameBoard.appendChild(levelMessage);

    // Moldura vermelha que pisca ao subir de nível
const flashNivel = document.createElement('div');
    flashNivel.id = 'flash-nivel';
    document.body.appendChild(flashNivel);

function piscarVermelho() {
    flashNivel.classList.remove('piscando');
    void flashNivel.offsetWidth;          // reinicia a animação
    flashNivel.classList.add('piscando');
}

// Faz o obstáculo recomeçar da direita, respeitando a velocidade do nível atual
function reiniciarObstaculo() {
    toco.style.animation = 'none';
    void toco.offsetWidth;
    toco.style.animation = `obstaculo-animation ${VELOCIDADE_INICIAL}s infinite linear`;

    const taxa = VELOCIDADE_INICIAL / currentSpeed;
    const anims = toco.getAnimations ? toco.getAnimations() : [];

    if (anims.length) {
        anims[0].playbackRate = taxa;
    } else {
        toco.style.animationDuration = `${currentSpeed}s`;
    }
}

function iniciarAlertaNivel() {
    obstaculoOculto = true;
    moedasOcultas = true;

    toco.style.visibility = 'hidden';

    // marca as moedas da tela para sumir (o coração de vida extra fica)
    run.moedasLista.forEach(m => {
        if (m.tipo !== 'coracao') {
            m.remover = true;
            m.elem.style.display = 'none';
        }
    });

    clearTimeout(alertaTimeout);
    alertaTimeout = setTimeout(terminarAlertaNivel, TEMPO_ALERTA);
}

function terminarAlertaNivel() {
    obstaculoOculto = false;
    moedasOcultas = false;

    toco.style.visibility = '';
    reiniciarObstaculo();        // o obstáculo volta pela direita
    tempoUltimaMoeda = 0;        // as moedas voltam a aparecer depois de 3s

    clearTimeout(alertaTimeout);
    alertaTimeout = null;
}

    // Sistema de moedas
    const run = {
        moedasLista: []
    };

    let tempoUltimaMoeda = 0;
    const dt = 0.01;

    // Recupera o nome salvo
    const savedName = localStorage.getItem('jump_ti_player');

    if (savedName && playerInput) {
        playerInput.value = savedName;
    }

    // Atualiza o estado do personagem
    function updateCharacterState() {
        const nameValue = playerInput.value.trim();

        if (btnChooseCharacter) {
            btnChooseCharacter.disabled = nameValue === '';
        }

        updateSelectedLabel();
        applyCharacter();
    }

    playerInput.addEventListener('input', updateCharacterState);

    function updateSelectedLabel() {
        if (characterSelected) {
            characterSelected.textContent = `Personagem: ${selectedCharacter.nome}`;
        }
    }

    function applyCharacter() {
        document.body.dataset.cenario = selectedCharacter.id; 
        document.documentElement.style.setProperty('--chao', (selectedCharacter.chao || 0) + 'px');
        if (fazendeiro) {
            fazendeiro.src = gifFresco(selectedCharacter.img);
            fazendeiro.style.width = selectedCharacter.tamanho + 'px';

        }
        if (toco) {
            toco.src = selectedCharacter.obstaculo;
        }
        // Fundo do menu acompanha o cenário do personagem
        document.documentElement.style.setProperty(
            '--menu-bg', `url('${selectedCharacter.fundo}')`
        );
        atualizarFundo();
    }

    updateCharacterState();

    // Exibe os personagens disponíveis
    function renderCharacters() {
        characterGrid.innerHTML = '';

        ALL_CHARACTERS.forEach(c => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'character-card' + (c.id === selectedCharacter.id ? ' selected' : '');
            card.innerHTML = `
                <img src="${gifFresco(c.img)}" alt="${escapeHtml(c.nome)}">
                <span>${escapeHtml(c.nome)}</span>
            `;

            card.addEventListener('click', () => {
                selectedCharacter = c;
                localStorage.setItem('jump_ti_character', c.id);
                updateSelectedLabel();
                applyCharacter();
                renderCharacters();
            });

            characterGrid.appendChild(card);
        });
    }

    // Abre e fecha a tela Sobre Nós (só funciona se o botão existir no index.php)
    if (btnAbout && aboutModal) {
        btnAbout.addEventListener('click', () => {
            startModal.classList.remove('active');
            aboutModal.classList.add('active');
        });
    }

    if (btnCloseAbout && aboutModal) {
        btnCloseAbout.addEventListener('click', () => {
            aboutModal.classList.remove('active');
            startModal.classList.add('active');
        });
    }

    // Abre a escolha de personagem
    btnChooseCharacter.addEventListener('click', () => {
        if (playerInput.value.trim() === '') {
            return;
        }
        renderCharacters();
        startModal.classList.remove('active');
        characterModal.classList.add('active');
    });

    // Inicia com o personagem escolhido
    btnStartCharacter.addEventListener('click', () => {
        const nameValue = playerInput.value.trim();

        if (!nameValue) {
            characterModal.classList.remove('active');
            startModal.classList.add('active');
            playerInput.focus();
            return;
        }

        currentPlayer = nameValue;
        localStorage.setItem('jump_ti_player', currentPlayer);
        updateCharacterState();
        characterModal.classList.remove('active');
        startGame();
    });

    // ==========================================
    // SISTEMA DE MOEDAS
    // ==========================================

    function gerarMoeda() {
        const altura = Math.random() < 0.5 ? 80 : 140;
        criarMoeda(gameBoard.clientWidth, altura);
    }

    function gerarGrupoMoedas() {
        const quantidade = Math.floor(Math.random() * 3) + 3;
        const inicioX = gameBoard.clientWidth;
        const altura = Math.random() < 0.5 ? 80 : 140;
        const espacamento = 45;

        for (let i = 0; i < quantidade; i++) {
            criarMoeda(inicioX + i * espacamento, altura);
        }
    }

    function criarMoeda(x, alturaDoChao) {
        alturaDoChao += selectedCharacter.chao || 0;
        const elem = document.createElement('img');
        elem.src = 'assets/moeda.gif';
        elem.className = 'moeda';
        elem.alt = 'Moeda';

        elem.style.position = 'absolute';
        elem.style.bottom = `${alturaDoChao}px`;
        elem.style.width = '40px';
        elem.style.height = '40px';
        elem.style.left = `${x}px`;
        elem.style.right = 'auto';
        elem.style.animation = 'none';

        gameBoard.appendChild(elem);

        const y = gameBoard.clientHeight - alturaDoChao - 40;

        run.moedasLista.push({
            elem,
            x,
            y,
            largura: 40,
            altura: 40,
            coletada: false,
            tColeta: 0
        });
    }

    // Coração de vida extra (aparece a cada 10 níveis)
    function gerarCoracao() {
        if (lives >= MAX_VIDAS) return;
        const alturaDoChao = 110 + (selectedCharacter.chao || 0);
        const x = gameBoard.clientWidth;

        const elem = document.createElement('div');
        elem.className = 'coracao';
        elem.textContent = '❤️';

        Object.assign(elem.style, {
            position: 'absolute',
            bottom: `${alturaDoChao}px`,
            left: `${x}px`,
            width: '44px',
            height: '44px',
            fontSize: '40px',
            lineHeight: '44px',
            textAlign: 'center',
            zIndex: '9',
            pointerEvents: 'none',
            filter: 'drop-shadow(0 0 8px #ff3b6b)'
        });

        gameBoard.appendChild(elem);

        run.moedasLista.push({
            tipo: 'coracao',
            elem,
            x,
            y: gameBoard.clientHeight - alturaDoChao - 44,
            largura: 44,
            altura: 44,
            coletada: false,
            tColeta: 0
        });
    }

    function coletarCoracao(m) {
        m.coletada = true;
        m.elem.style.display = 'none';

        lives = Math.min(lives + 1, MAX_VIDAS);
        atualizarVidas();
        somVidaExtra();
        mostrarMensagem('❤️ VIDA EXTRA! ❤️');
    }

    function caixaMoeda(m) {
        return {
            x: m.x,
            y: m.y,
            largura: m.largura,
            altura: m.altura
        };
    }

    function colide(p, c) {
        return (
            p.x < c.x + c.largura &&
            p.x + p.largura > c.x &&
            p.y < c.y + c.altura &&
            p.y + p.altura > c.y
        );
    }

    function coletarMoeda(m) {
        m.coletada = true;
        somMoeda();
        m.elem.style.display = 'none';

        coins += 1;
        score += 5;

        if (coinsDisplay) {
            coinsDisplay.textContent = coins;
        }

        scoreDisplay.textContent = score;

        atualizarNivel();
        mostrarMaisCinco();
    }

    function atualizarMoedas() {
    if (!moedasOcultas) {
        tempoUltimaMoeda += dt;

        if (tempoUltimaMoeda >= 3) {
            if (Math.random() < 0.5) {
                gerarMoeda();
            } else {
                gerarGrupoMoedas();
            }
            tempoUltimaMoeda = 0;
        }
    }
        const player = {
            x: fazendeiro.offsetLeft + 30,
            y: fazendeiro.offsetTop + 15,
            largura: Math.max(40, fazendeiro.offsetWidth - 60),
            altura: Math.max(40, fazendeiro.offsetHeight - 25)
        };

        for (let i = 0; i < run.moedasLista.length; i++) {
            const m = run.moedasLista[i];

            if (m.remover) {
                if (m.elem.parentNode) {
                    m.elem.parentNode.removeChild(m.elem);
                }
                run.moedasLista.splice(i, 1);
                i--;
                continue;
            }

            m.x -= (400 / currentSpeed) * dt;
            m.elem.style.left = `${m.x}px`;

            if (m.coletada) {
                m.tColeta += dt;
            } else if (colide(player, caixaMoeda(m))) {
                if (m.tipo === 'coracao') {
                    coletarCoracao(m);
                } else {
                    coletarMoeda(m);
                }
            }

            if (m.x < -50 || m.tColeta > 1) {
                if (m.elem.parentNode) {
                    m.elem.parentNode.removeChild(m.elem);
                }
                run.moedasLista.splice(i, 1);
                i--;
            }
        }
    }

    function limpaMoedas() {
        run.moedasLista.forEach(m => {
            if (m.elem.parentNode) {
                m.elem.parentNode.removeChild(m.elem);
            }
        });
        run.moedasLista = [];
        tempoUltimaMoeda = 0;
    }

    // ==========================================
    // SONS (Web Audio API)
    // ==========================================

    let audioCtx = null;

    function iniciarAudio() {
        if (!audioCtx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            audioCtx = new AC();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function tocarNota(freq, inicio, duracao, tipo = 'square', volume = 0.12, freqFim = null) {
        const ctx = iniciarAudio();
        if (!ctx) return;

        const t0 = ctx.currentTime + inicio;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = tipo;
        osc.frequency.setValueAtTime(freq, t0);

        if (freqFim) {
            osc.frequency.exponentialRampToValueAtTime(freqFim, t0 + duracao);
        }

        gain.gain.setValueAtTime(volume, t0);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duracao);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t0);
        osc.stop(t0 + duracao + 0.02);
    }

    // Som de pulo estilo Mario Bros (frequência subindo rapidamente)
    function somPuloSintetico() {
        tocarNota(150, 0, 0.15, 'square', 0.15, 600);
    }

    function somMoedaSintetico() {
        tocarNota(988, 0, 0.08);
        tocarNota(1319, 0.08, 0.35);
    }

    function somVidaExtra() {
        [523, 659, 784, 1047].forEach((n, i) => {
            tocarNota(n, i * 0.09, 0.2, 'square', 0.12);
        });
    }

    function somDanoSintetico() {
        tocarNota(500, 0, 0.35, 'sawtooth', 0.12, 90);
    }

    function somMorteSintetico() {
        const notas = [523, 494, 466, 440, 392, 330, 262, 196];
        notas.forEach((n, i) => {
            tocarNota(n, i * 0.14, 0.2, 'triangle', 0.2);
        });
        tocarNota(130, notas.length * 0.14, 0.6, 'square', 0.1, 55);
    }

    const ARQUIVOS_SOM = {
        moeda: 'assets/sons/moeda.wav',
        dano: 'assets/sons/dano.wav',
        morte: 'assets/sons/morte.wav',
        pulo: 'assets/sons/pulo.wav'
    };

    const audiosCarregados = {};

    Object.keys(ARQUIVOS_SOM).forEach(nome => {
        const audio = new Audio(ARQUIVOS_SOM[nome]);
        audio.preload = 'auto';
        audio.volume = 0.6;
        audio.addEventListener('error', () => {
            audio.falhou = true;
        });
        audiosCarregados[nome] = audio;
    });

    function tocarSom(nome, alternativo) {
        const audio = audiosCarregados[nome];
        if (!audio || audio.falhou) {
            alternativo();
            return;
        }
        const copia = audio.cloneNode();
        copia.volume = audio.volume;
        copia.play().catch(() => alternativo());
    }

    // ==========================================
    // MÚSICA DE FUNDO
    // ==========================================

    const ARQUIVO_MUSICA = 'assets/musica.mp3';   // troque a extensão se o seu arquivo for outra (.wav, .ogg...)

    const musica = new Audio(ARQUIVO_MUSICA);
    musica.loop = true;
    musica.volume = 0.3;                           // 0 (mudo) até 1 (máximo)
    musica.preload = 'auto';

    function tocarMusica() {
        musica.currentTime = 0;
        musica.play().catch(() => {});
    }

    function pararMusica() {
        musica.pause();
        musica.currentTime = 0;
    }

    function somPulo() {
        tocarSom('pulo', somPuloSintetico);
    }

    function somMoeda() {
        tocarSom('moeda', somMoedaSintetico);
    }

    function somDano() {
        tocarSom('dano', somDanoSintetico);
    }

    function somMorte() {
        tocarSom('morte', somMorteSintetico);
    }

    // ==========================================
    // SISTEMA DE VIDAS E NÍVEIS
    // ==========================================

    function atualizarVidas() {
        if (!livesDisplay) return;
        livesDisplay.textContent = '❤️'.repeat(Math.max(lives, 0));
    }

    function pararPiscar() {
        clearInterval(blinkInterval);
        clearTimeout(invulneravelTimeout);
        blinkInterval = null;
        invulneravelTimeout = null;
        invulneravel = false;
        fazendeiro.style.opacity = '1';
    }

    // Aviso flutuante em cima do personagem (ex: -1 ❤️)
    function mostrarAvisoVida(texto, classe = 'perdeu-vida') {
        const aviso = document.createElement('div');
        aviso.className = `aviso-vida ${classe}`;
        aviso.textContent = texto;

        // centralizado no personagem, um pouco acima da cabeça
        aviso.style.left = `${fazendeiro.offsetLeft + fazendeiro.offsetWidth / 2}px`;
        aviso.style.top = `${Math.max(80, fazendeiro.offsetTop - 30)}px`;   // 80 = não esconder atrás da barra do topo

        gameBoard.appendChild(aviso);
        aviso.addEventListener('animationend', () => aviso.remove());
    }

    function perderVida(tocoPosition, fazendeiroPosition) {
        lives -= 1;
        atualizarVidas();
        mostrarAvisoVida('-1 ❤️');  

        coins = 0;
        if (coinsDisplay) {
            coinsDisplay.textContent = coins;
        }

        if (lives <= 0) {
            pararPiscar();
            somMorte();
            triggerGameOver(tocoPosition, fazendeiroPosition);
            return;
        }

        somDano();

        invulneravel = true;
        clearInterval(blinkInterval);
        clearTimeout(invulneravelTimeout);

        blinkInterval = setInterval(() => {
            fazendeiro.style.opacity =
                fazendeiro.style.opacity === '0.3' ? '1' : '0.3';
        }, 120);

        invulneravelTimeout = setTimeout(pararPiscar, TEMPO_INVULNERAVEL);
    }


   function atualizarFundo() {
        const escuro = Math.floor(currentLevel / NIVEIS_POR_FUNDO) % 2 === 1;
        const src = escuro ? selectedCharacter.fundoEscuro : selectedCharacter.fundo;

        document.body.classList.toggle('modo-escuro', escuro);

        gameBoard.style.backgroundImage = `url('${src}')`;

        fundoParallax.querySelectorAll('.parallax-img').forEach(tile => {
        tile.style.backgroundImage = `url('${src}')`;
        });
    }

    function atualizarNivel() {
        const novoNivel = Math.floor(score / 100) + 1;

        if (novoNivel <= currentLevel) return;

        const nivelAnterior = currentLevel;
        currentLevel = novoNivel;

        // A cada 10 níveis (10, 20, 30...) aparece um coração de vida extra
        if (Math.floor(currentLevel / 5) > Math.floor(nivelAnterior / 5)) {
            gerarCoracao();
        }

        if (levelDisplay) {
            levelDisplay.textContent = currentLevel;
        }

        currentSpeed = Math.max(
            VELOCIDADE_MAXIMA,
            VELOCIDADE_INICIAL - ((currentLevel - 1) * REDUCAO_POR_NIVEL)
        );

        const taxa = VELOCIDADE_INICIAL / currentSpeed;
        const animFundo = fundoParallax.getAnimations ? fundoParallax.getAnimations() : [];
            if (animFundo.length) animFundo[0].updatePlaybackRate(taxa);
        const anims = toco.getAnimations ? toco.getAnimations() : [];

        if (anims.length && anims[0].updatePlaybackRate) {
            anims[0].updatePlaybackRate(taxa);
        } else {
            toco.style.animationDuration = `${currentSpeed}s`;
        }

        atualizarFundo();
        mostrarMensagemNivel(currentLevel);
    }

   function mostrarMensagemNivel(nivel) {
    mostrarMensagem(`SUBIU DE NÍVEL ${nivel} ! DIFICULDADE AUMENTADA`);
    piscarVermelho();                      // ← nova linha
    iniciarAlertaNivel();
    }

    function mostrarMensagem(texto) {
        levelMessage.textContent = texto;
        levelMessage.style.opacity = '1';
        levelMessage.style.transform = 'translate(-50%, -50%) scale(1)';

        if (levelMessageTimeout) {
            clearTimeout(levelMessageTimeout);
        }

        levelMessageTimeout = setTimeout(() => {
            esconderMensagemNivel();
        }, 2000);
    }

    function esconderMensagemNivel() {
        levelMessage.style.opacity = '0';
        levelMessage.style.transform = 'translate(-50%, -50%) scale(0.8)';

        if (levelMessageTimeout) {
            clearTimeout(levelMessageTimeout);
            levelMessageTimeout = null;
        }
    }

    // ==========================================
    // INÍCIO E RESET
    // ==========================================

    function startGame() {
        iniciarAudio();
        tocarMusica();

        clearInterval(gameLoop);
        clearInterval(scoreLoop);

        resetElements();

        isPlaying = true;
        lives = VIDAS_INICIAIS;
        pararPiscar();
        atualizarVidas();
        score = 0;
        coins = 0;
        currentLevel = 1;
        currentSpeed = VELOCIDADE_INICIAL;

        esconderMensagemNivel();

        scoreDisplay.textContent = '0';

        if (levelDisplay) {
            levelDisplay.textContent = '1';
        }

        if (coinsDisplay) {
            coinsDisplay.textContent = '0';
        }

        hudPlayerName.textContent = currentPlayer || 'Jogador';

        gameBoard.classList.add('running');

        scoreLoop = setInterval(() => {
            if (isPlaying) {
                score += 1;
                scoreDisplay.textContent = score;
                atualizarNivel();
            }
        }, 300);

        gameLoop = setInterval(checkCollision, 10);
    }

    function resetElements() {
        currentSpeed = VELOCIDADE_INICIAL;
        currentLevel = 1;

        const animFundoReset = fundoParallax.getAnimations ? fundoParallax.getAnimations() : [];
        if (animFundoReset.length) animFundoReset[0].updatePlaybackRate(1);

        lives = VIDAS_INICIAIS;
        pararPiscar();
        atualizarVidas();

        atualizarFundo();
        esconderMensagemNivel();

        toco.style.animation = `obstaculo-animation ${currentSpeed}s infinite linear`;
        toco.style.animationDuration = `${currentSpeed}s`;
        toco.style.left = '';

        limpaMoedas();
        terminarAlertaNivel();

       // Carrega o GIF do cenário escolhido e reinicia a animação do zero
    if (lindo) {
        if (selectedCharacter.lindo) {
            lindo.src = gifFresco(selectedCharacter.lindo);
            lindo.style.display = '';
        } else {
            lindo.removeAttribute('src');
            lindo.style.display = 'none';
        }
    }

        fazendeiro.src = gifFresco(selectedCharacter.img);
        toco.src = selectedCharacter.obstaculo;
        fazendeiro.style.animation = '';
        fazendeiro.style.bottom = '';
        fazendeiro.classList.remove('jump', 'derrotado');

        if (jumpTip) {
            jumpTip.style.opacity = '1';
        }
    }

    // ==========================================
    // PULO
    // ==========================================

    const NIVEL_PULO_RAPIDO = 6;     // a partir deste nível o pulo acelera
    const FATOR_PULO_RAPIDO = 0.6;   // menor = pulo mais rápido

    const NIVEL_PULO_MUITO_RAPIDO = 10;    // a partir deste nível o pulo acelera ainda mais
    const FATOR_PULO_MUITO_RAPIDO = 0.45;  // menor = pulo mais rápido (precisa ser menor que 0.6)

    function jump() {
        if (!isPlaying) return;

        if (fazendeiro.classList.contains('jump')) return;

        // Toca o som do Mario Bros
        somPulo();

        // Define o fator de velocidade conforme o nível
        let fator = 1;
        if (currentLevel >= NIVEL_PULO_MUITO_RAPIDO) {
            fator = FATOR_PULO_MUITO_RAPIDO;
        } else if (currentLevel >= NIVEL_PULO_RAPIDO) {
            fator = FATOR_PULO_RAPIDO;
        }

        fazendeiro.style.animationDuration = '';
        fazendeiro.classList.add('jump');

        if (fator !== 1) {
            const duracaoBase = parseFloat(getComputedStyle(fazendeiro).animationDuration) || 0;
            if (duracaoBase > 0) {
                fazendeiro.style.animationDuration = (duracaoBase * fator) + 's';
            }
        }

        if (jumpTip) {
            jumpTip.style.opacity = '0';
        }

        fazendeiro.addEventListener('animationend', () => {
            fazendeiro.classList.remove('jump');
        }, { once: true });
    }
    // ==========================================
    // COLISÕES
    // ==========================================

    function checkCollision() {
        if (!isPlaying) return;

        const chickenRect = fazendeiro.getBoundingClientRect();
        const foxRect = toco.getBoundingClientRect();

        const margemHorizontal = 50;
        const margemVertical = 50;

        const colidiu =
            chickenRect.right - margemHorizontal > foxRect.left + margemHorizontal &&
            chickenRect.left + margemHorizontal < foxRect.right - margemHorizontal &&
            chickenRect.bottom - margemVertical > foxRect.top + margemVertical &&
            chickenRect.top + margemVertical < foxRect.bottom - margemVertical;

        if (colidiu && !invulneravel && !obstaculoOculto) {
            const bottomAtual = parseFloat(getComputedStyle(fazendeiro).bottom) || 0;
            perderVida(toco.offsetLeft, bottomAtual);

            if (!isPlaying) return;
        }

        atualizarMoedas();
    }

    function mostrarMaisCinco() {
        if (!plusFive) return;
        plusFive.classList.remove('animate-plus-five');
        void plusFive.offsetWidth;
        plusFive.classList.add('animate-plus-five');
    }

    // ==========================================
    // GAME OVER & RANKING
    // ==========================================

    function triggerGameOver(tocoPosition, fazendeiroPosition) {
        isPlaying = false;
        pararMusica();

        clearInterval(gameLoop);
        clearInterval(scoreLoop);

        gameBoard.classList.remove('running');

        toco.style.animation = 'none';
        toco.style.left = `${tocoPosition}px`;

        fazendeiro.style.animation = 'none';
        fazendeiro.style.bottom = `${fazendeiroPosition}px`;
        fazendeiro.classList.add('derrotado');

        finalScoreValue.textContent = score;
        saveStatusMsg.textContent = 'A gravar pontuação na base de dados...';
        saveStatusMsg.style.color = '#9d4dff';

        gameoverModal.classList.add('active');

        saveScore(currentPlayer, score);
    }

    function saveScore(playerName, finalScore) {
        fetch('salvar_ranking.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: playerName, pontos: finalScore })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                saveStatusMsg.textContent = 'Pontuação registada!';
                saveStatusMsg.style.color = '#00e5ff';

                if (data.ranking) {
                    renderRanking(data.ranking, playerName, finalScore);
                }
            } else {
                saveStatusMsg.textContent = '⚠️ ' + (data.message || 'Erro ao registar.');
                saveStatusMsg.style.color = '#c04dff';
            }
        })
        .catch(err => {
            console.error('Erro na requisição:', err);
            saveStatusMsg.textContent = '⚠️ Erro ao conectar ao servidor.';
            saveStatusMsg.style.color = '#c04dff';
        });
    }

    function fetchRanking() {
        fetch('obter_ranking.php')
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success' && data.ranking) {
                    renderRanking(data.ranking);
                }
            })
            .catch(err => console.error('Erro ao buscar ranking:', err));
    }

    function renderRanking(list, highlightName = null, highlightScore = null) {
        if (!rankingBody) return;

        rankingBody.innerHTML = '';

        if (!list || list.length === 0) {
            rankingBody.innerHTML = `
                <tr>
                    <td colspan="3" class="loading-cell">
                        Nenhuma pontuação gravada ainda. Jogue para ser o 1º!
                    </td>
                </tr>
            `;
            return;
        }

        let highlighted = false;

        list.forEach((item, index) => {
            const tr = document.createElement('tr');

            if (
                !highlighted &&
                highlightName &&
                item.nome === highlightName &&
                parseInt(item.pontos, 10) === highlightScore
            ) {
                tr.classList.add('highlight-current');
                highlighted = true;
            }

            let medal = `${index + 1}º`;
            if (index === 0) medal = '🥇 1º';
            else if (index === 1) medal = '🥈 2º';
            else if (index === 2) medal = '🥉 3º';

            tr.innerHTML = `
                <td class="ranking-pos">${medal}</td>
                <td><strong>${escapeHtml(item.nome)}</strong></td>
                <td>${parseInt(item.pontos, 10)} pts</td>
            `;

            rankingBody.appendChild(tr);
        });
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ==========================================
    // EVENTOS DE ENTRADA
    // ==========================================

    startForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const nameValue = playerInput.value.trim();
        if (!nameValue) {
            playerInput.focus();
            return;
        }

        currentPlayer = nameValue;
        localStorage.setItem('jump_ti_player', currentPlayer);
        updateCharacterState();

        startModal.classList.remove('active');
        startGame();
    });

    btnRestart.addEventListener('click', () => {
        gameoverModal.classList.remove('active');

        if (!currentPlayer) {
            startModal.classList.add('active');
            playerInput.focus();
        } else {
            startGame();
        }
    });

    btnChangePlayer.addEventListener('click', () => {
        gameoverModal.classList.remove('active');
        resetElements();

        startModal.classList.add('active');
        playerInput.value = '';
        updateCharacterState();
        playerInput.focus();
    });

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowUp') {
            if (isPlaying) {
                e.preventDefault();
                jump();
            }
        }
    });
});