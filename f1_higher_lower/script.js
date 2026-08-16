let drivers = [];
let currentLeft = null;
let currentRight = null;
let score = 0;
let highScore = 0;
let isAnimating = false;
let replaceLeftNext = false; // Alternates every round
let keptSide = null; // Track which driver was kept

// Load drivers data
async function loadData() {
    try {
        const rawResponse = await fetch('../f1_wins.json?t=' + new Date().getTime());
        drivers = await rawResponse.json();
        
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
        
        // Remove drivers with 0 wins to keep it interesting
        drivers = drivers.filter(d => d.wins > 0);
        
        initGame();
    } catch (e) {
        console.error("Failed to load data", e);
        document.body.innerHTML = "<h1>Failed to load driver data.</h1>";
    }
}

function getRandomDriver() {
    const index = Math.floor(Math.random() * drivers.length);
    return drivers[index];
}

function initGame() {
    score = 0;
    document.getElementById('score').innerText = score;
    document.getElementById('game-over').classList.add('hidden');
    isAnimating = false;
    replaceLeftNext = false; // Start by replacing right, keeping left
    keptSide = null; // Initially no side is kept (both are new)
    
    currentLeft = getRandomDriver();
    currentRight = getRandomDriver();
    while (currentLeft.driver === currentRight.driver) {
        currentRight = getRandomDriver();
    }
    
    updateUI();
}

function advanceRound() {
    if (replaceLeftNext) {
        currentLeft = getRandomDriver();
        while (currentLeft.driver === currentRight.driver) {
            currentLeft = getRandomDriver();
        }
        keptSide = 'right';
    } else {
        currentRight = getRandomDriver();
        while (currentRight.driver === currentLeft.driver) {
            currentRight = getRandomDriver();
        }
        keptSide = 'left';
    }
    replaceLeftNext = !replaceLeftNext;
    updateUI();
}

function updateUI() {
    // Left side
    document.getElementById('left-name').innerText = currentLeft.driver;
    document.getElementById('left-stat').innerText = currentLeft.wins;
    document.getElementById('left-bg').style.backgroundImage = `url('${currentLeft.image_url || ""}')`;
    
    // Right side
    document.getElementById('right-name').innerText = currentRight.driver;
    document.getElementById('right-stat').innerText = currentRight.wins;
    document.getElementById('right-bg').style.backgroundImage = `url('${currentRight.image_url || ""}')`;
    
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
    if (choice === 'left') {
        isCorrect = currentLeft.wins >= currentRight.wins;
    } else {
        isCorrect = currentRight.wins >= currentLeft.wins;
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
    const text = `I scored ${score} on F1 Higher or Lower! Can you beat my score?`;
    if (navigator.share) {
        navigator.share({
            title: 'F1 Higher or Lower',
            text: text,
            url: window.location.href,
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(text + " " + window.location.href).then(() => {
            alert("Score copied to clipboard!");
        }).catch(err => {
            alert("Failed to copy score.");
        });
    }
}

function gameOver() {
    document.getElementById('final-score').innerText = score;
    document.getElementById('game-over').classList.remove('hidden');
}

// Start
loadData();
