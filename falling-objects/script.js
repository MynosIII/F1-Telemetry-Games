const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const gameOverScreen = document.getElementById('gameOver');
const finalScoreDisplay = document.getElementById('finalScore');

let score = 0;
let isGameOver = false;
let animationId;

// Game logical size (to keep physics independent of screen size)
const LOGICAL_WIDTH = 600;
const LOGICAL_HEIGHT = 800;

// Physics / Game rules
const PADDLE_WIDTH = 120;
const PADDLE_HEIGHT = 20;
const PADDLE_Y_OFFSET = 40;
const ITEM_SIZE = 24;

// Object Pools / State
let paddle = {
    x: LOGICAL_WIDTH / 2 - PADDLE_WIDTH / 2,
    y: LOGICAL_HEIGHT - PADDLE_Y_OFFSET,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: 8
};

let items = [];
let spawnRate = 60; 
let frames = 0;
let minSpeed = 3;
let maxSpeed = 5;

// Controls
let rightPressed = false;
let leftPressed = false;
let mouseX = null;

// Ensure canvas matches its display size
function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Update paddle Y based on new height if needed, but keeping logical height is easier.
    // Actually, let's just scale the context to logical size.
    const scaleX = canvas.width / LOGICAL_WIDTH;
    const scaleY = canvas.height / LOGICAL_HEIGHT;
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Initial call

// Event Listeners
document.addEventListener('keydown', (e) => {
    if(e.key === 'Right' || e.key === 'ArrowRight') { rightPressed = true; mouseX = null; }
    else if(e.key === 'Left' || e.key === 'ArrowLeft') { leftPressed = true; mouseX = null; }
});

document.addEventListener('keyup', (e) => {
    if(e.key === 'Right' || e.key === 'ArrowRight') rightPressed = false;
    else if(e.key === 'Left' || e.key === 'ArrowLeft') leftPressed = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = LOGICAL_WIDTH / rect.width;
    mouseX = (e.clientX - rect.left) * scaleX;
});

canvas.addEventListener('mouseleave', () => {
    mouseX = null; // Stop following mouse if it leaves canvas
});

// Touch support for mobile/tablet
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = LOGICAL_WIDTH / rect.width;
    mouseX = (e.touches[0].clientX - rect.left) * scaleX;
}, { passive: false });

function spawnItem() {
    // 60% chance for good item (green), 40% for bad (red)
    const isGood = Math.random() > 0.4;
    const x = Math.random() * (LOGICAL_WIDTH - ITEM_SIZE);
    items.push({
        x: x,
        y: -ITEM_SIZE,
        size: ITEM_SIZE,
        type: isGood ? 'good' : 'bad',
        speed: minSpeed + Math.random() * (maxSpeed - minSpeed)
    });
}

function update() {
    if (isGameOver) return;

    frames++;

    // Paddle movement
    if (mouseX !== null) {
        paddle.x = mouseX - paddle.width / 2;
    } else {
        if (rightPressed) paddle.x += paddle.speed;
        if (leftPressed) paddle.x -= paddle.speed;
    }

    // Boundary collision for paddle
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > LOGICAL_WIDTH) paddle.x = LOGICAL_WIDTH - paddle.width;

    // Difficulty scaling
    if (frames % 300 === 0) { // Every ~5 seconds
        if (spawnRate > 20) spawnRate -= 5;
        minSpeed += 0.5;
        maxSpeed += 0.5;
    }

    if (frames % spawnRate === 0) {
        spawnItem();
    }

    // Update and check items
    for (let i = items.length - 1; i >= 0; i--) {
        let item = items[i];
        item.y += item.speed;

        // Check collision with paddle (AABB Collision)
        if (
            item.x < paddle.x + paddle.width &&
            item.x + item.size > paddle.x &&
            item.y < paddle.y + paddle.height &&
            item.y + item.size > paddle.y
        ) {
            if (item.type === 'good') {
                score += 10;
                scoreDisplay.textContent = `Score: ${score}`;
            } else {
                gameOver();
            }
            items.splice(i, 1);
        } else if (item.y > LOGICAL_HEIGHT) {
            // Missed item
            if(item.type === 'good') {
                score = Math.max(0, score - 5); // penalize missing green items
                scoreDisplay.textContent = `Score: ${score}`;
            }
            items.splice(i, 1);
        }
    }
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

function draw() {
    // Clear the logical area
    ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    // Draw paddle
    ctx.fillStyle = '#18181b'; // Zinc 900
    drawRoundedRect(ctx, paddle.x, paddle.y, paddle.width, paddle.height, 10);

    // Draw items
    for (let item of items) {
        if (item.type === 'good') {
            ctx.fillStyle = '#22c55e'; // Green 500
            ctx.beginPath();
            ctx.arc(item.x + item.size / 2, item.y + item.size / 2, item.size / 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = '#ef4444'; // Red 500
            drawRoundedRect(ctx, item.x, item.y, item.size, item.size, 6);
        }
    }
}

function loop() {
    if (!isGameOver) {
        update();
        draw();
        animationId = requestAnimationFrame(loop);
    }
}

function gameOver() {
    isGameOver = true;
    finalScoreDisplay.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// Attach to window so button can click it
window.restartGame = function() {
    score = 0;
    scoreDisplay.textContent = `Score: ${score}`;
    isGameOver = false;
    items = [];
    frames = 0;
    spawnRate = 60;
    minSpeed = 3;
    maxSpeed = 5;
    paddle.x = LOGICAL_WIDTH / 2 - paddle.width / 2;
    mouseX = null;
    gameOverScreen.classList.add('hidden');
    loop();
};

// Start
loop();
