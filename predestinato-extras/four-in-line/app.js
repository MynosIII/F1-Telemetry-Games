const COLUMNS = 7;
const ROWS = 6;

// State
let board = [];
let currentPlayer = 1;
let gameActive = true;

// DOM Elements
const boardElement = document.getElementById('board');
const turnIndicator = document.getElementById('turnIndicator');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const winnerMessage = document.getElementById('winnerMessage');
const restartBtn = document.getElementById('restartBtn');

// Initialize Game
function initGame() {
    board = Array(COLUMNS).fill(null).map(() => Array(ROWS).fill(0));
    currentPlayer = 1;
    gameActive = true;
    
    updateTurnIndicator();
    gameOverOverlay.classList.add('hidden');
    renderBoard();
}

// Render Board structure
function renderBoard() {
    boardElement.innerHTML = '';
    
    // Create columns
    for (let c = 0; c < COLUMNS; c++) {
        const columnEl = document.createElement('div');
        columnEl.classList.add('column');
        columnEl.dataset.col = c;
        
        columnEl.addEventListener('click', () => handleColumnClick(c));

        // Create cells within column (top to bottom)
        for (let r = ROWS - 1; r >= 0; r--) {
            const cellEl = document.createElement('div');
            cellEl.classList.add('cell');
            cellEl.id = `cell-${c}-${r}`;
            columnEl.appendChild(cellEl);
        }
        
        boardElement.appendChild(columnEl);
    }
}

// Handle column click
function handleColumnClick(col) {
    if (!gameActive) return;

    const row = getAvailableRow(col);
    if (row === -1) return; // Column is full

    // Update state
    board[col][row] = currentPlayer;
    
    // Update UI
    animateTokenDrop(col, row, currentPlayer);
    
    // Check for win or draw
    if (checkWin(col, row, currentPlayer)) {
        endGame(`Player ${currentPlayer} Wins!`, currentPlayer);
    } else if (checkDraw()) {
        endGame("It's a Draw!", 0);
    } else {
        // Switch turn
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        updateTurnIndicator();
    }
}

function getAvailableRow(col) {
    for (let r = 0; r < ROWS; r++) {
        if (board[col][r] === 0) {
            return r;
        }
    }
    return -1;
}

function animateTokenDrop(col, row, player) {
    const cellEl = document.getElementById(`cell-${col}-${row}`);
    const token = document.createElement('div');
    token.classList.add('token', `player${player}`);
    
    // The CSS animation handles the drop effect
    cellEl.appendChild(token);
}

function updateTurnIndicator() {
    turnIndicator.textContent = `Player ${currentPlayer}'s Turn`;
    turnIndicator.className = `turn-indicator player${currentPlayer}`;
}

// Win checking logic
function checkWin(c, r, player) {
    return checkDirection(c, r, player, 1, 0) || // horizontal
           checkDirection(c, r, player, 0, 1) || // vertical
           checkDirection(c, r, player, 1, 1) || // diagonal /
           checkDirection(c, r, player, 1, -1);  // diagonal \
}

function checkDirection(c, r, player, dc, dr) {
    let count = 1; // Count the recently played piece

    // Check one direction
    for (let i = 1; i < 4; i++) {
        const checkC = c + i * dc;
        const checkR = r + i * dr;
        if (isValid(checkC, checkR) && board[checkC][checkR] === player) {
            count++;
        } else {
            break;
        }
    }

    // Check opposite direction
    for (let i = 1; i < 4; i++) {
        const checkC = c - i * dc;
        const checkR = r - i * dr;
        if (isValid(checkC, checkR) && board[checkC][checkR] === player) {
            count++;
        } else {
            break;
        }
    }

    return count >= 4;
}

function isValid(c, r) {
    return c >= 0 && c < COLUMNS && r >= 0 && r < ROWS;
}

function checkDraw() {
    for (let c = 0; c < COLUMNS; c++) {
        if (board[c][ROWS - 1] === 0) {
            return false;
        }
    }
    return true;
}

function endGame(message, winningPlayer) {
    gameActive = false;
    winnerMessage.textContent = message;
    
    if (winningPlayer === 1) {
        winnerMessage.style.color = 'var(--player1-color)';
    } else if (winningPlayer === 2) {
        winnerMessage.style.color = 'var(--player2-color)';
    } else {
        winnerMessage.style.color = 'var(--text-color)';
    }

    setTimeout(() => {
        gameOverOverlay.classList.remove('hidden');
    }, 600); // Wait for the last token to finish dropping
}

restartBtn.addEventListener('click', initGame);

// Start game
initGame();
