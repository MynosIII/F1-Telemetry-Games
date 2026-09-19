let drivers = [];
let currentLeft = null;
let currentRight = null;
let score = 0;
let highScore = 0;
let isAnimating = false;
let replaceLeftNext = false; // Alternates every round
let keptSide = null; // Track which driver was kept
let currentMode = 'wins'; // 'wins' or 'gps'
let seenDrivers = []; // Track recently seen drivers

// Load drivers data
async function loadData() {
    try {
        seenDrivers = []; // Clear seen drivers when loading new mode
        const file = currentMode === 'wins' ? '../f1_wins.json' : '../f1_gps.json';
        const rawResponse = await fetch(file + '?t=' + new Date().getTime());
        if (!rawResponse.ok) throw new Error('Driver data unavailable');
        drivers = await rawResponse.json();
        if (!Array.isArray(drivers) || drivers.length < 2) throw new Error('Not enough drivers');
        
        let images = {};
        try {
            const imgResponse = await fetch('../shared/driver_images.json?t=' + new Date().getTime());
            if (imgResponse.ok) {
                images = await imgResponse.json();
            }
        } catch (e) {
            console.error("Failed to load images map", e);
        }
        
        // Merge images into drivers
        drivers.forEach(d => {
            if (images[d.driver]) {
                d.image_url = images[d.driver];
            }
        });
        
        // Remove drivers with 0 to keep it interesting
        if (currentMode === 'wins') {
            drivers = drivers.filter(d => d.wins > 0);
        } else {
            drivers = drivers.filter(d => d.gps > 0);
        }
        
        initGame();
    } catch (e) {
        console.error("Failed to load data", e);
        let error = document.getElementById('data-error');
        if (!error) { error = document.createElement('section'); error.id = 'data-error'; error.setAttribute('role','alert'); document.body.append(error); }
        error.innerHTML = '<p>Failed to load driver data.</p><button type="button">Try again</button>';
        error.querySelector('button').onclick = () => { error.remove(); loadData(); };
    }
}

function getRandomDriver() {
    let limit = Math.floor(drivers.length * 0.75);
    let candidate;
    let attempts = 0;
    do {
        const index = Math.floor(Math.random() * drivers.length);
        candidate = drivers[index];
        attempts++;
        if (attempts > 1000) break; // Safety fallback
    } while (seenDrivers.includes(candidate.driver));
    
    seenDrivers.push(candidate.driver);
    if (seenDrivers.length > limit) {
        seenDrivers.shift();
    }
    
    return candidate;
}

function initGame() {
    score = 0;
    document.getElementById('score').innerText = score;
    document.getElementById('game-over').classList.add('hidden');
    
    // Update labels and top bar
    const labelText = currentMode === 'wins' ? 'race wins' : 'raced GPs';
    const topBarText = currentMode === 'wins' ? 'Click the one with more wins' : 'Click the one with more raced GPs';
    document.getElementById('left-label').innerText = labelText;
    document.getElementById('right-label').innerText = labelText;
    document.getElementById('top-bar-text').innerText = topBarText;

    isAnimating = false;
    replaceLeftNext = false; // Start by replacing right, keeping left
    keptSide = null; // Initially no side is kept (both are new)
    
    currentLeft = getRandomDriver();
    currentRight = getRandomDriver();
    
    updateUI();
}

function advanceRound() {
    if (replaceLeftNext) {
        currentLeft = getRandomDriver();
        keptSide = 'right';
    } else {
        currentRight = getRandomDriver();
        keptSide = 'left';
    }
    replaceLeftNext = !replaceLeftNext;
    updateUI();
}

function updateUI() {
    // Left side
    document.getElementById('left-name').innerText = currentLeft.driver;
    document.getElementById('left-stat').innerText = currentMode === 'wins' ? currentLeft.wins : currentLeft.gps;
    GameImages.portrait(document.getElementById("left-bg"), currentLeft.image_url, currentLeft.driver);
    
    // Right side
    document.getElementById('right-name').innerText = currentRight.driver;
    document.getElementById('right-stat').innerText = currentMode === 'wins' ? currentRight.wins : currentRight.gps;
    GameImages.portrait(document.getElementById("right-bg"), currentRight.image_url, currentRight.driver);
    
    // Hide stats initially
    document.getElementById('left-stat').classList.add('hidden');
    document.getElementById('right-stat').classList.add('hidden');
    document.getElementById('left-label').classList.add('hidden');
    document.getElementById('right-label').classList.add('hidden');
    
    // Reveal stat for the driver that was kept from the previous round
    if (keptSide === 'left') {
        document.getElementById('left-stat').classList.remove('hidden');
        document.getElementById('left-label').classList.remove('hidden');
    } else if (keptSide === 'right') {
        document.getElementById('right-stat').classList.remove('hidden');
        document.getElementById('right-label').classList.remove('hidden');
    }
}

function guess(choice) {
    if (isAnimating) return;
    isAnimating = true;
    
    document.getElementById('left-stat').classList.remove('hidden');
    document.getElementById('right-stat').classList.remove('hidden');
    document.getElementById('left-label').classList.remove('hidden');
    document.getElementById('right-label').classList.remove('hidden');
    
    let isCorrect = false;
    const leftVal = currentMode === 'wins' ? currentLeft.wins : currentLeft.gps;
    const rightVal = currentMode === 'wins' ? currentRight.wins : currentRight.gps;

    if (choice === 'left') {
        isCorrect = leftVal >= rightVal;
    } else {
        isCorrect = rightVal >= leftVal;
    }
    
    const chosenScreen = choice === 'left' ? document.getElementById('left-screen') : document.getElementById('right-screen');
    
    if (isCorrect) {
        score++;
        document.getElementById('score').innerText = score;
        if (score > highScore) {
            highScore = score;
            document.getElementById('high-score').innerText = highScore;
        }
        
        chosenScreen.classList.add('correct-guess');
        
        setTimeout(() => {
            chosenScreen.classList.remove('correct-guess');
            advanceRound();
            isAnimating = false;
        }, 1500);
        
    } else {
        chosenScreen.classList.add('incorrect-guess');
        setTimeout(() => {
            chosenScreen.classList.remove('incorrect-guess');
            gameOver();
        }, 1500);
    }
}

function shareScore() {
    const text = GameI18n.t(`I scored ${score} on F1 Higher or Lower! Can you beat my score?`);
    if (navigator.share) {
        navigator.share({
            title: 'F1 Higher or Lower',
            text: text,
            url: window.location.href,
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(text + " " + window.location.href).then(() => {
            alert(GameI18n.t("Score copied to clipboard!"));
        }).catch(err => {
            alert(GameI18n.t("Failed to copy score."));
        });
    }
}

function gameOver() {
    document.getElementById('final-score').innerText = score;
    document.getElementById('game-over').classList.remove('hidden');
}

function startGame(mode) {
    currentMode = mode;
    document.getElementById('main-menu').classList.add('hidden');
    loadData();
}

function backToMenu() {
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
}
