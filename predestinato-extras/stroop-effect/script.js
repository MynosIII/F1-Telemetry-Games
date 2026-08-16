const colors = [
    { name: 'Red', hex: '#e74c3c' },
    { name: 'Blue', hex: '#3498db' },
    { name: 'Green', hex: '#2ecc71' },
    { name: 'Yellow', hex: '#f1c40f' },
    { name: 'Orange', hex: '#e67e22' },
    { name: 'Purple', hex: '#9b59b6' }
];

let score = 0;
let timeLeft = 2.0;
let timerInterval;
let currentColorHex = '';
let currentColorName = '';
let gameActive = false;

const wordDisplay = document.getElementById('word-display');
const scoreDisplay = document.getElementById('score');
const timeDisplay = document.getElementById('time');
const progressBar = document.getElementById('progress-bar');
const colorButtonsContainer = document.getElementById('color-buttons');
const gameOverScreen = document.getElementById('game-over');
const gameOverReason = document.getElementById('game-over-reason');
const startScreen = document.getElementById('start-screen');
const finalScoreDisplay = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Initialize buttons
function initButtons() {
    colorButtonsContainer.innerHTML = '';
    colors.forEach(color => {
        const btn = document.createElement('button');
        btn.classList.add('color-btn');
        btn.textContent = color.name;
        btn.disabled = true; // Disabled initially
        btn.addEventListener('click', () => handleGuess(color.hex));
        colorButtonsContainer.appendChild(btn);
    });
}

function startGame() {
    score = 0;
    scoreDisplay.textContent = score;
    gameActive = true;
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    
    // Enable buttons
    const btns = document.querySelectorAll('.color-btn');
    btns.forEach(btn => btn.disabled = false);

    nextRound();
}

function nextRound() {
    if (!gameActive) return;

    clearInterval(timerInterval);
    
    // Pick random word text and random color
    const wordIndex = Math.floor(Math.random() * colors.length);
    let colorIndex = Math.floor(Math.random() * colors.length);
    
    // Higher chance (e.g. 70%) to be a mismatch to ensure Stroop effect is tested
    if (Math.random() < 0.7) {
        while(colorIndex === wordIndex) {
            colorIndex = Math.floor(Math.random() * colors.length);
        }
    }

    const wordText = colors[wordIndex].name;
    currentColorHex = colors[colorIndex].hex;
    currentColorName = colors[colorIndex].name;

    wordDisplay.textContent = wordText;
    wordDisplay.style.color = currentColorHex;

    timeLeft = 2.0;
    updateTimerDisplay();
    
    // Start timer (update every 50ms for smooth progress bar)
    timerInterval = setInterval(() => {
        timeLeft -= 0.05;
        if (timeLeft <= 0) {
            timeLeft = 0;
            updateTimerDisplay();
            endGame("You ran out of time!");
        } else {
            updateTimerDisplay();
        }
    }, 50);
}

function updateTimerDisplay() {
    timeDisplay.textContent = timeLeft.toFixed(1);
    const percentage = (timeLeft / 2.0) * 100;
    progressBar.style.width = `${percentage}%`;
    
    if (percentage > 50) {
        progressBar.style.backgroundColor = 'var(--green)';
    } else if (percentage > 25) {
        progressBar.style.backgroundColor = 'var(--yellow)';
    } else {
        progressBar.style.backgroundColor = 'var(--red)';
    }
}

function handleGuess(guessedHex) {
    if (!gameActive) return;

    if (guessedHex === currentColorHex) {
        score++;
        scoreDisplay.textContent = score;
        nextRound();
    } else {
        endGame(`Wrong! The font color was ${currentColorName}.`);
    }
}

function endGame(reason) {
    gameActive = false;
    clearInterval(timerInterval);
    
    // Disable buttons
    const btns = document.querySelectorAll('.color-btn');
    btns.forEach(btn => btn.disabled = true);

    gameOverReason.textContent = reason;
    finalScoreDisplay.textContent = score;
    gameOverScreen.style.display = 'flex';
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Initialize on load
initButtons();
