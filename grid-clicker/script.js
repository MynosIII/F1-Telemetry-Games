const grid = document.getElementById('grid');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const startBtn = document.getElementById('start-btn');
const gameOverScreen = document.getElementById('game-over');
const finalScoreDisplay = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

const GRID_SIZE = 4;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;
let score = 0;
let lives = 3;
let activeCell = null;
let gameTimer = null;
let currentInterval = 1000;
let isPlaying = false;

function initGrid() {
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
    for (let i = 0; i < TOTAL_CELLS; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        
        // Setup events
        cell.addEventListener('mousedown', handleCellClick);
        cell.addEventListener('touchstart', (e) => {
            e.preventDefault(); 
            handleCellClick(e);
        }, {passive: false});
        
        grid.appendChild(cell);
    }
}

function handleCellClick(e) {
    if (!isPlaying) return;
    
    const cell = e.target;
    
    // Prevent double clicking while a cell is processing error animation
    if (cell.classList.contains('error')) return;

    if (cell.classList.contains('active')) {
        // Hit target
        score++;
        scoreDisplay.textContent = score;
        cell.classList.remove('active');
        activeCell = null;
        clearTimeout(gameTimer);
        
        // Decrease interval by 5%, minimum 300ms
        currentInterval = Math.max(300, currentInterval * 0.95);
        
        // Spawn next immediately
        spawnTarget();
    } else {
        // Miss (clicked wrong cell)
        cell.classList.add('error');
        setTimeout(() => {
            if (cell) cell.classList.remove('error');
        }, 400);
        loseLife();
    }
}

function spawnTarget() {
    if (!isPlaying) return;
    
    const cells = document.querySelectorAll('.cell');
    
    // If target already active when spawnTarget is called, it means time ran out
    if (activeCell !== null) {
        cells[activeCell].classList.remove('active');
        
        const missedCellIndex = activeCell;
        cells[missedCellIndex].classList.add('error');
        setTimeout(() => {
            if (cells[missedCellIndex]) cells[missedCellIndex].classList.remove('error');
        }, 400);
        
        loseLife();
        if (!isPlaying) return;
    }
    
    let newCell;
    do {
        newCell = Math.floor(Math.random() * TOTAL_CELLS);
    } while (newCell === activeCell);
    
    activeCell = newCell;
    cells[activeCell].classList.add('active');
    
    gameTimer = setTimeout(() => {
        spawnTarget();
    }, currentInterval);
}

function loseLife() {
    lives--;
    livesDisplay.textContent = lives;
    
    const statContainer = livesDisplay.parentElement;
    statContainer.style.color = 'var(--danger-color)';
    setTimeout(() => {
        statContainer.style.color = '';
    }, 300);
    
    if (lives <= 0) {
        endGame();
    }
}

function startGame() {
    score = 0;
    lives = 3;
    currentInterval = 1000;
    activeCell = null;
    isPlaying = true;
    
    scoreDisplay.textContent = score;
    livesDisplay.textContent = lives;
    
    startBtn.style.display = 'none';
    gameOverScreen.classList.remove('visible');
    grid.style.opacity = '1';
    
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.classList.remove('active', 'error');
    });
    
    // Brief delay before the first block appears
    setTimeout(() => {
        if(isPlaying) spawnTarget();
    }, 500);
}

function endGame() {
    isPlaying = false;
    clearTimeout(gameTimer);
    activeCell = null;
    
    finalScoreDisplay.textContent = score;
    gameOverScreen.classList.add('visible');
    
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => cell.classList.remove('active'));
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Initialize on load
initGrid();
grid.style.opacity = '0.5';
