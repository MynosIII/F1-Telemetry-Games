const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const gameArea = document.getElementById('game-area');

const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const livesEl = document.getElementById('lives');
const finalScoreEl = document.getElementById('final-score');

let score = 0;
let level = 1;
let lives = 3;
let isPlaying = false;
let targets = [];
let spawnIntervalId;
let gameLoopId;
let lastTime = 0;

// Difficulty parameters
let currentSpawnRate = 1200; // ms between spawns
let currentMaxRadius = 60; // px
let currentShrinkRate = 30; // px per second
let targetsClickedThisLevel = 0;
const targetsPerLevel = 10;

function initGame() {
    score = 0;
    level = 1;
    lives = 3;
    targetsClickedThisLevel = 0;
    currentSpawnRate = 1200;
    currentMaxRadius = 60;
    currentShrinkRate = 30;

    targets.forEach(t => t.element.remove());
    targets = [];
    
    // Clear any existing popups
    const popups = document.querySelectorAll('.score-popup, .penalty-popup');
    popups.forEach(p => p.remove());
    
    updateHUD();
    
    startScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    gameScreen.classList.add('active');
    
    isPlaying = true;
    lastTime = performance.now();
    
    scheduleNextSpawn();
    gameLoopId = requestAnimationFrame(gameLoop);
}

function endGame() {
    isPlaying = false;
    clearTimeout(spawnIntervalId);
    cancelAnimationFrame(gameLoopId);
    
    finalScoreEl.textContent = score;
    gameScreen.classList.remove('active');
    gameOverScreen.classList.add('active');
}

function updateHUD() {
    scoreEl.textContent = score;
    levelEl.textContent = level;
    livesEl.textContent = lives;
}

function levelUp() {
    level++;
    targetsClickedThisLevel = 0;
    
    // Increase difficulty: cap the spawn rate so it doesn't get ridiculously fast,
    // and radius not too tiny.
    currentSpawnRate = Math.max(400, currentSpawnRate * 0.85); // Faster spawns
    currentMaxRadius = Math.max(25, currentMaxRadius * 0.92); // Smaller targets
    currentShrinkRate = currentShrinkRate * 1.15; // Faster shrinking
    
    updateHUD();
}

function scheduleNextSpawn() {
    if (!isPlaying) return;
    const nextSpawnTime = currentSpawnRate * (0.7 + Math.random() * 0.6); // Randomize spawn rate a bit
    spawnIntervalId = setTimeout(() => {
        spawnTarget();
        scheduleNextSpawn();
    }, nextSpawnTime);
}

function spawnTarget() {
    const radius = currentMaxRadius;
    const x = Math.random() * (gameArea.clientWidth - radius * 2) + radius;
    const y = Math.random() * (gameArea.clientHeight - radius * 2 - 80) + radius + 80; // Offset for HUD
    
    const targetElement = document.createElement('div');
    targetElement.classList.add('target');
    targetElement.style.left = `${x}px`;
    targetElement.style.top = `${y}px`;
    targetElement.style.width = `${radius * 2}px`;
    targetElement.style.height = `${radius * 2}px`;
    
    const targetObj = {
        element: targetElement,
        radius: radius,
        x: x,
        y: y
    };
    
    targetElement.addEventListener('mousedown', (e) => {
        e.stopPropagation(); // Prevents the gameArea background click
        if (!isPlaying) return;
        clickTarget(targetObj, e.clientX, e.clientY);
    });

    // Touch support
    targetElement.addEventListener('touchstart', (e) => {
        e.preventDefault(); 
        e.stopPropagation();
        if (!isPlaying) return;
        const touch = e.touches[0];
        clickTarget(targetObj, touch.clientX, touch.clientY);
    });
    
    gameArea.appendChild(targetElement);
    targets.push(targetObj);
}

function showPopup(text, x, y, isPenalty) {
    const popup = document.createElement('div');
    popup.textContent = text;
    popup.className = isPenalty ? 'penalty-popup' : 'score-popup';
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    gameArea.appendChild(popup);
    
    setTimeout(() => {
        popup.remove();
    }, 600);
}

function clickTarget(targetObj, clickX, clickY) {
    const points = 10 * level;
    score += points;
    targetsClickedThisLevel++;
    
    showPopup(`+${points}`, clickX, clickY, false);
    
    if (targetsClickedThisLevel >= targetsPerLevel) {
        levelUp();
    } else {
        updateHUD();
    }
    
    removeTarget(targetObj);
}

function removeTarget(targetObj) {
    targetObj.element.remove();
    targets = targets.filter(t => t !== targetObj);
}

function targetMissed(targetObj) {
    removeTarget(targetObj);
    lives--;
    updateHUD();
    
    // Add visual feedback for losing a life
    gameArea.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
    setTimeout(() => {
        gameArea.style.backgroundColor = '';
    }, 150);
    
    if (lives <= 0) {
        endGame();
    }
}

function gameLoop(timestamp) {
    if (!isPlaying) return;
    
    const dt = (timestamp - lastTime) / 1000; // in seconds
    lastTime = timestamp;
    
    // Update targets
    for (let i = targets.length - 1; i >= 0; i--) {
        const target = targets[i];
        target.radius -= currentShrinkRate * dt;
        
        if (target.radius <= 0) {
            targetMissed(target);
        } else {
            target.element.style.width = `${target.radius * 2}px`;
            target.element.style.height = `${target.radius * 2}px`;
        }
    }
    
    gameLoopId = requestAnimationFrame(gameLoop);
}

// Miss click penalty on game area
gameArea.addEventListener('mousedown', (e) => {
    if (isPlaying) {
        const penalty = 5 * level;
        if (score >= penalty) {
            score -= penalty;
        } else {
            score = 0;
        }
        showPopup(`-${penalty}`, e.clientX, e.clientY, true);
        updateHUD();
    }
});

startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);
