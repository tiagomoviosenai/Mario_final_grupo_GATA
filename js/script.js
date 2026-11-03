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
    const clouds = document.getElementById('clouds');
    const hudPlayerName = document.getElementById('hud-player-name');
    const jumpTip = document.getElementById('jump-tip');

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
            img: 'assets/img_sg/personagem_sg.gif',
            fundo: 'assets/img_sg/fundo_sg.png',
            fundoEscuro: 'assets/img_sg/fundo_s_sg.png',
            nuvem: 'assets/img_sg/ceu_sg.webp',
            nuvemEscura: 'assets/img_sg/ceu_s_sg.png',
            obstaculo: 'assets/img_sg/obt_sg.png'
        },
        {
            id: 'tg',
            nome: 'Fazendeiro',
            img: 'assets/img_tg/personagem_tg.gif',
            fundo: 'assets/img_tg/fundo_tg.jpg',
            fundoEscuro: 'assets/img_tg/fundo_s_tg.jpg',
            nuvem: 'assets/img_tg/ceu_tg.png',
            nuvemEscura: 'assets/img_tg/ceu_s_tg.png',
            obstaculo: 'assets/img_tg/obt_tg.png'
        },
        {
            id: 'gus',
            nome: 'Link',
            img: 'assets/img_gus/personagem_gus.gif',
            fundo: 'assets/img_gus/fundo_gus.png',
            fundoEscuro: 'assets/img_gus/fundo_s_gus.png',
            obstaculo: 'assets/img_gus/obt_gus.png'
        }
    ];

    // Reinicia a animação de um GIF (o parâmetro novo força o navegador a recarregar)
    function gifFresco(src) {
        return `${src}?r=${Date.now()}`;
    }

    // Pré-carrega cenários e obstáculos (os GIFs ficam de fora para não terminarem a animação antes da hora)
    ALL_CHARACTERS.forEach(c => {
        [c.fundo, c.fundoEscuro, c.nuvem, c.nuvemEscura, c.obstaculo].filter(Boolean).forEach(src => {
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
    let lives = VIDAS_INICIAIS;
    let invulneravel = false;
    let invulneravelTimeout = null;
    let blinkInterval = null;

    let gameLoop = null;
    let scoreLoop = null;

    // Velocidade e nível
    let currentSpeed = 2.5;
    let currentLevel = 1;
    let levelMessageTimeout = null;

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
        color: '#00e5ff',
        border: '3px solid #9d4dff',
        borderRadius: '0',
        fontSize: 'clamp(12px, 2.5vw, 22px)',
        fontWeight: '400',
        textAlign: 'center',
        textShadow: '2px 2px 0 #4b1d9c, 0 0 12px #00e5ff',
        zIndex: '1000',
        pointerEvents: 'none',
        opacity: '0',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        whiteSpace: 'nowrap'
    });

    gameBoard.appendChild(levelMessage);

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
        if (fazendeiro) {
            fazendeiro.src = gifFresco(selectedCharacter.img);
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
        tempoUltimaMoeda += dt;

        if (tempoUltimaMoeda >= 3) {
            if (Math.random() < 0.5) {
                gerarMoeda();
            } else {
                gerarGrupoMoedas();
            }
            tempoUltimaMoeda = 0;
        }

        const player = {
            x: fazendeiro.offsetLeft + 30,
            y: fazendeiro.offsetTop + 15,
            largura: Math.max(40, fazendeiro.offsetWidth - 60),
            altura: Math.max(40, fazendeiro.offsetHeight - 25)
        };

        for (let i = 0; i < run.moedasLista.length; i++) {
            const m = run.moedasLista[i];

            m.x -= (400 / currentSpeed) * dt;
            m.elem.style.left = `${m.x}px`;

            if (m.coletada) {
                m.tColeta += dt;
            } else if (colide(player, caixaMoeda(m))) {
                coletarMoeda(m);
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

    function perderVida(tocoPosition, fazendeiroPosition) {
        lives -= 1;
        atualizarVidas();

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
        gameBoard.style.backgroundImage = `url('${src}')`;

        // Troca também a imagem das nuvens quando o cenário fica escuro.
        if (clouds) {
            const nuvemSrc = escuro
                ? (selectedCharacter.nuvemEscura || selectedCharacter.nuvem)
                : selectedCharacter.nuvem;
            if (nuvemSrc) {
                if (!clouds.src.endsWith(nuvemSrc)) {
                    clouds.src = nuvemSrc;
                }
                clouds.style.display = 'block';
            } else {
                clouds.style.display = 'none';
            }
        }
    }

    function atualizarNivel() {
        const novoNivel = Math.floor(score / 100) + 1;

        if (novoNivel <= currentLevel) return;

        currentLevel = novoNivel;

        if (levelDisplay) {
            levelDisplay.textContent = currentLevel;
        }

        const REDUCAO_POR_NIVEL = 0.2;
        const VELOCIDADE_MAXIMA = 1.1;

        currentSpeed = Math.max(
            VELOCIDADE_MAXIMA,
            2.5 - ((currentLevel - 1) * REDUCAO_POR_NIVEL)
        );

        const taxa = 2.5 / currentSpeed;
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
        levelMessage.textContent = `🎉 SUBIU DE NÍVEL! NÍVEL ${nivel} 🎉`;
        levelMessage.style.opacity = '1';
        levelMessage.style.transform = 'translate(-50%, -50%) scale(1)';

        if (levelMessageTimeout) {
            clearTimeout(levelMessageTimeout);
        }

        levelMessageTimeout = setTimeout(() => {
            esconderMensagemNivel();
        }, 1800);
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
        currentSpeed = 2.5;

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
        currentSpeed = 2.5;
        currentLevel = 1;

        lives = VIDAS_INICIAIS;
        pararPiscar();
        atualizarVidas();

        atualizarFundo();
        esconderMensagemNivel();

        toco.style.animation = `obstaculo-animation ${currentSpeed}s infinite linear`;
        toco.style.animationDuration = `${currentSpeed}s`;
        toco.style.left = '';

        limpaMoedas();

        fazendeiro.src = gifFresco(selectedCharacter.img);
        toco.src = selectedCharacter.obstaculo;
        fazendeiro.style.animation = '';
        fazendeiro.style.bottom = '0px';
        fazendeiro.classList.remove('jump', 'derrotado');

        if (jumpTip) {
            jumpTip.style.opacity = '1';
        }
    }

    // ==========================================
    // PULO
    // ==========================================

    function jump() {
        if (!isPlaying) return;

        if (fazendeiro.classList.contains('jump')) return;

        // Toca o som do Mario Bros
        somPulo();

        fazendeiro.classList.add('jump');

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

        if (colidiu && !invulneravel) {
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