<?php

require_once 'conexao.php';

// Busca inicial do ranking para carregar rápido na primeira abertura
$rankingInicial = [];
try {
    $stmt = $pdo->query("
        SELECT id, nome, pontos, DATE_FORMAT(data_registro, '%d/%m/%Y %H:%i') as data 
        FROM ranking 
        ORDER BY pontos DESC, id ASC 
        LIMIT 10
    ");
    $rankingInicial = $stmt->fetchAll();
} catch (Exception $e) {
    // Caso o banco ainda não possua registros
    $rankingInicial = [];
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jump - Ti</title>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>

    <div class="game-container">
        
        <header class="hud-bar">
            <div class="player-info">
                <span class="label">JOGADOR:</span>
                <span class="value" id="hud-player-name">---</span>
            </div>
            
            <div class="hud-stats">
                <div class="lives-info">
                    <span class="label">VIDAS:</span>
                    <span class="value" id="lives-display">❤️❤️❤️</span>
                </div>
                <div class="level-info">
                    <span class="label">NÍVEL:</span>
                    <span class="value" id="level-display">1</span>
                </div>
                <div class="coins-info">
                    <span class="label">🪙 MOEDAS:</span>
                    <span class="value" id="coins-display">0</span>
                </div>
                <div class="score-info">
                    <span class="label">PONTOS:</span>
                    <span class="value" id="score-display">0</span>
                </div>
            </div>
        </header>

        
        <main class="game-board" id="game-board">
            <img src="assets/lindo.gif" class="lindo" id="lindo" alt="" aria-hidden="true">
            <img src="assets/img_ana/personagem_ana.gif" class="personagem" alt="Personagem">
            
            <img src="assets/img_ana/obt_ana.png" class="obstaculo" alt="Obstáculo">
            
            
            
            <!-- Texto flutuante do +5 da moeda -->
            <div id="plus-five">+5</div>
            
            <span class="jump-tip" id="jump-tip">Pressione ESPAÇO ou clique para pular</span>
        </main>
    </div>

    <!-- 1. TELA DE INÍCIO / INSERIR NOME -->
    <div class="modal-overlay active" id="start-modal">
        <div class="modal-card">
            <div class="modal-header">
                <h1 class="game-title">JUMP - TI</h1>
                <p class="game-subtitle">Corra, desvie e dispute o topo do ranking!</p>
            </div>

            <form class="start-form" id="start-form">
                <div class="input-group">
                    <label for="player-input">DIGITE SEU NOME:</label>
                    <input 
                        type="text" 
                        id="player-input" 
                        placeholder="Ex: Seu Nome" 
                        maxlength="30" 
                        required 
                        autocomplete="off"
                        autofocus
                    >

                    <button type="button" class="btn btn-character" id="btn-choose-character" disabled>
                        ESCOLHER PERSONAGEM
                    </button>
                    <small class="character-selected" id="character-selected"></small>
                </div>

                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary" id="btn-start">INICIAR JOGO</button>
                  <a  class="game-title" href="site/index.html">SOBRE NÓS</a>
                </div>
            </form>

            <div class="server-status" id="server-status">
                <span class="status-dot online"></span> Conectado ao MySQL
            </div>
        </div>
    </div>

    <!-- TELA DE ESCOLHA DE PERSONAGEM -->
    <div class="modal-overlay" id="character-modal">
        <div class="modal-card">
            <div class="modal-header">
                <h2 class="game-title">ESCOLHA SEU PERSONAGEM</h2>
            </div>
            <div class="character-grid" id="character-grid"></div>
            <div class="modal-actions">
                <button type="button" class="btn btn-primary" id="btn-start-character">INICIAR JOGO</button>
            </div>
        </div>
    </div>

    <!-- 2. TELA DE GAME OVER & RANKING -->
    <div class="modal-overlay" id="gameover-modal">
        <div class="modal-card gameover-card">
            <div class="modal-header">
                <h2 class="gameover-title">GAME OVER</h2>
                <div class="final-score-box">
                    <div class="final-score-label">SUA PONTUAÇÃO</div>
                    <div class="final-score-num" id="final-score-value">0</div>
                    <div class="save-status" id="save-status-msg"></div>
                </div>
            </div>

            <!-- Tabela com o TOP 10 -->
            <div class="ranking-container">
                <h3 class="ranking-title">🏆 TOP 10 MELHORES PONTUAÇÕES</h3>
                <div class="table-wrapper">
                    <table class="ranking-table">
                        <thead>
                            <tr>
                                <th>POS</th>
                                <th>JOGADOR</th>
                                <th>PONTUAÇÃO</th>
                            </tr>
                        </thead>
                        <tbody id="ranking-body">
                            <?php if (!empty($rankingInicial)): ?>
                                <?php foreach ($rankingInicial as $i => $row): ?>
                                    <tr>
                                        <td class="ranking-pos">
                                            <?= $i === 0 ? '🥇 1º' : ($i === 1 ? '🥈 2º' : ($i === 2 ? '🥉 3º' : ($i + 1) . 'º')) ?>
                                        </td>
                                        <td><strong><?= htmlspecialchars($row['nome']) ?></strong></td>
                                        <td><?= (int)$row['pontos'] ?> pts</td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <tr>
                                    <td colspan="3" class="loading-cell">Nenhuma pontuação gravada ainda. Jogue para ser o 1º!</td>
                                </tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="modal-actions">
                <button type="button" class="btn btn-primary" id="btn-restart">JOGAR NOVAMENTE</button>
                <button type="button" class="btn btn-secondary" id="btn-change-player">TROCAR JOGADOR</button>
            </div>
        </div>
    </div>

    <script src="js/script.js" defer></script>
</body>
</html>