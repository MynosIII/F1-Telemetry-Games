const player = document.getElementById('player');
const gameContainer = document.getElementById('game-container');
const scoreDisplay = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

let currentLane = 1; // 0: left, 1: center, 2: right
let score = 0;
let isPlaying = false;
let obstacles = [];
let gameSpeed = 8; // pixels per frame
let obstacleSpawnInterval = 500; // ms
let lastSpawnTime = 0;
let animationFrameId;
let queuedLane = null;

function updatePlayerPosition() {
    player.className = `pos-${currentLane}`;
}

function isLaneSafe(lane) {
    const containerHeight = gameContainer.clientHeight;
    // 1 pixel buffer around the actual visual hitbox
    const playerTop = containerHeight - 91;
    const playerBottom = containerHeight - 49;

    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];
        const obsTop = obs.y;
        const obsBottom = obs.y + 40;
        
        if (obsBottom > playerTop && obsTop < playerBottom) {
            if (obs.lane === lane) {
                return false;
            }
        }
    }
    return true;
}

function handleInput(direction) {
    if (!isPlaying) return;
    
    let targetLane = currentLane;
    if (direction === 'left' && currentLane > 0) {
        targetLane--;
    } else if (direction === 'right' && currentLane < 2) {
        targetLane++;
    }
    
    if (targetLane !== currentLane) {
        if (isLaneSafe(targetLane)) {
            currentLane = targetLane;
            updatePlayerPosition();
            queuedLane = null;
        } else {
            // Queue the move so it executes the moment it's safe
            queuedLane = targetLane;
        }
    }
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handleInput('left');
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        handleInput('right');
    }
});

// Touch controls
let touchStartX = 0;
gameContainer.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});
gameContainer.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const deltaX = touchEndX - touchStartX;
    if (Math.abs(deltaX) > 30) {
        if (deltaX > 0) {
            handleInput('right');
        } else {
            handleInput('left');
        }
    }
});

function createObstacle() {
    const lane = Math.floor(Math.random() * 3);
    const obstacle = document.createElement('div');
    obstacle.className = `obstacle pos-${lane}`;
    obstacle.style.top = '-50px';
    gameContainer.appendChild(obstacle);
    
    obstacles.push({
        element: obstacle,
        lane: lane,
        y: -50,
        passed: false
    });
}

function updateGame(timestamp) {
    if (!isPlaying) return;

    if (timestamp - lastSpawnTime > obstacleSpawnInterval) {
        createObstacle();
        lastSpawnTime = timestamp;
    }

    const containerHeight = gameContainer.clientHeight;

    // Exact visual hitbox for perfectly fair deaths
    const playerTop = containerHeight - 90;
    const playerBottom = containerHeight - 50;

    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];
        obs.y += gameSpeed;
        obs.element.style.top = obs.y + 'px';

        // Collision logic
        const obsTop = obs.y;
        const obsBottom = obs.y + 40; // 40 is obstacle height

        // Check if vertically overlapping
        if (obsBottom > playerTop && obsTop < playerBottom) {
            // Check if in the same lane
            if (obs.lane === currentLane) {
                gameOver();
                return; // Stop updating
            }
        }

        // Passed logic
        if (!obs.passed && obsTop > playerBottom) {
            obs.passed = true;
            score++;
            scoreDisplay.textContent = score;
            
            // Increase difficulty
            gameSpeed += 0.1;
            obstacleSpawnInterval = Math.max(300, obstacleSpawnInterval - 10);
        }

        // Cleanup
        if (obs.y > containerHeight) {
            obs.element.remove();
            obstacles.splice(i, 1);
            i--;
        }
    }

    if (queuedLane !== null && isLaneSafe(queuedLane)) {
        currentLane = queuedLane;
        updatePlayerPosition();
        queuedLane = null;
    }

    animationFrameId = requestAnimationFrame(updateGame);
}

function startGame() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    // Clear old obstacles
    obstacles.forEach(obs => obs.element.remove());
    obstacles = [];
    
    score = 0;
    gameSpeed = 8;
    obstacleSpawnInterval = 500;
    currentLane = 1;
    queuedLane = null;
    scoreDisplay.textContent = score;
    updatePlayerPosition();
    
    isPlaying = true;
    lastSpawnTime = performance.now();
    animationFrameId = requestAnimationFrame(updateGame);
}

function gameOver() {
    isPlaying = false;
    cancelAnimationFrame(animationFrameId);
    finalScoreDisplay.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
