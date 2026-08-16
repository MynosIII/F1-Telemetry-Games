let circuits = [];
let currentMode = null; // 'easy' or 'hard'
let currentCircuit = null;
let currentLayout = null;
let score = 0;
let remainingCircuits = [];

// DOM Elements
const homeScreen = document.getElementById('home-screen');
const gameScreen = document.getElementById('game-screen');
const easyControls = document.getElementById('easy-controls');
const hardControls = document.getElementById('hard-controls');
const optionsGrid = document.getElementById('options-grid');
const hardForm = document.getElementById('hard-form');
const circuitInput = document.getElementById('circuit-input');
const scoreDisplay = document.getElementById('score');
const feedbackContainer = document.getElementById('feedback-container');
const feedbackTitle = document.getElementById('feedback-title');
const feedbackDesc = document.getElementById('feedback-desc');
const btnNext = document.getElementById('btn-next');

// Hardcoded Aliases
const ALIASES = {
    'spa-francorchamps': ['spa'],
    'monza': ['monza'],
    'silverstone': ['silverstone'],
    'interlagos': ['interlagos', 'sao paulo'],
    'suzuka': ['suzuka'],
    'catalunya': ['barcelona', 'spain'],
    'marina-bay': ['singapore'],
    'albert-park': ['melbourne'],
    'yas-marina': ['abu dhabi'],
    'baku': ['azerbaijan'],
    'jeddah': ['saudi arabia'],
    'cota': ['austin', 'texas'],
    'austin': ['cota', 'texas', 'circuit of the americas'],
    'red-bull-ring': ['austria', 'spielberg', 'a1 ring', 'osterreichring'],
    'spielberg': ['austria', 'red bull ring', 'a1 ring', 'osterreichring'],
    'zandvoort': ['netherlands', 'dutch'],
    'montreal': ['canada', 'gilles villeneuve'],
    'monaco': ['monte carlo'],
    'imola': ['san marino', 'emilia romagna', 'enzo e dino ferrari'],
    'nurburgring': ['nordschleife'],
    'hockenheimring': ['hockenheim'],
    'mexico-city': ['mexico', 'hermanos rodriguez']
};

// Initialization
async function init() {
    try {
        const response = await fetch('public/circuits.json');
        circuits = await response.json();
    } catch (err) {
        console.error('Failed to load circuits:', err);
    }

    document.getElementById('btn-easy-mode').addEventListener('click', () => startGame('easy'));
    document.getElementById('btn-hard-mode').addEventListener('click', () => startGame('hard'));
    document.getElementById('btn-3corners-mode').addEventListener('click', () => startGame('3corners'));
    document.getElementById('btn-back').addEventListener('click', showHome);
    
    hardForm.addEventListener('submit', handleHardSubmit);
}

function startGame(mode) {
    if (!circuits || circuits.length === 0) {
        alert("Circuits data not loaded yet.");
        return;
    }
    currentMode = mode;
    score = 0;
    updateScore(0);
    remainingCircuits = [...circuits];
    
    homeScreen.classList.remove('active');
    gameScreen.classList.add('active');
    
    easyControls.classList.add('hidden');
    hardControls.classList.add('hidden');
    
    if (mode === 'easy') {
        easyControls.classList.remove('hidden');
    } else {
        hardControls.classList.remove('hidden');
    }
    
    nextRound();
}

function showHome() {
    gameScreen.classList.remove('active');
    homeScreen.classList.add('active');
    feedbackContainer.classList.add('hidden');
}

function nextRound() {
    feedbackContainer.classList.add('hidden');
    
    if (currentMode === 'easy') {
        easyControls.classList.remove('hidden');
    } else {
        hardControls.classList.remove('hidden');
        circuitInput.value = '';
        circuitInput.focus();
    }
    
    if (remainingCircuits.length === 0) {
        remainingCircuits = [...circuits];
    }
    
    const randomIndex = Math.floor(Math.random() * remainingCircuits.length);
    currentCircuit = remainingCircuits.splice(randomIndex, 1)[0];
    
    // Pick a random layout for this circuit
    currentLayout = currentCircuit.layouts[Math.floor(Math.random() * currentCircuit.layouts.length)];
    
    loadAndDisplayCircuit(currentLayout, currentMode);
    
    if (currentMode === 'easy') {
        setupEasyMode();
    }
}

function setupEasyMode() {
    optionsGrid.innerHTML = '';
    
    const options = [currentCircuit];
    while (options.length < 4) {
        const randomCircuit = circuits[Math.floor(Math.random() * circuits.length)];
        if (!options.find(c => c.id === randomCircuit.id)) {
            options.push(randomCircuit);
        }
    }
    
    // Shuffle options
    options.sort(() => Math.random() - 0.5);
    
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt.name;
        btn.onclick = () => handleEasyGuess(opt.id, btn);
        optionsGrid.appendChild(btn);
    });
}

function handleEasyGuess(guessedId, btnElement) {
    // Disable all buttons
    const buttons = optionsGrid.querySelectorAll('.option-btn');
    buttons.forEach(b => b.disabled = true);
    
    if (guessedId === currentCircuit.id) {
        btnElement.classList.add('correct');
        handleWin();
    } else {
        btnElement.classList.add('wrong');
        // Highlight correct
        buttons.forEach(b => {
            if (b.textContent === currentCircuit.name) {
                b.classList.add('correct');
            }
        });
        handleLoss();
    }
}

function handleHardSubmit(e) {
    e.preventDefault();
    const guess = circuitInput.value;
    if (!guess.trim()) return;
    
    circuitInput.disabled = true;
    document.getElementById('btn-submit').disabled = true;
    
    if (checkFuzzyMatch(guess, currentCircuit)) {
        handleWin();
    } else {
        handleLoss();
    }
}

function normalizeStr(str) {
    if (!str) return '';
    return str.normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "") // remove accents/diacritics
              .replace(/[^a-z0-9]/gi, '')      // remove non-alphanumeric (dashes, spaces, etc)
              .toLowerCase();
}

function checkFuzzyMatch(guess, circuit) {
    const normalizedGuess = normalizeStr(guess);
    
    const possibleAnswers = [
        circuit.name,
        circuit.fullName,
        circuit.placeName,
        circuit.id
    ];
    
    if (ALIASES[circuit.id]) {
        possibleAnswers.push(...ALIASES[circuit.id]);
    }
    
    for (let ans of possibleAnswers) {
        if (normalizeStr(ans) === normalizedGuess) {
            return true;
        }
    }
    return false;
}

function handleWin() {
    updateScore(score + 1);
    showFeedback(true);
}

function handleLoss() {
    showFeedback(false);
}

function showFeedback(isWin) {
    if (currentMode === 'easy') {
        easyControls.classList.add('hidden');
    } else {
        hardControls.classList.add('hidden');
        circuitInput.disabled = false;
        document.getElementById('btn-submit').disabled = false;
    }
    
    if (currentMode === '3corners') {
        const svg = document.querySelector('#circuit-svg-container svg');
        if (svg) {
            const origVB = svg.dataset.origViewBox;
            if (origVB) {
                svg.setAttribute('viewBox', origVB);
            }
            const paths = svg.querySelectorAll('path');
            paths.forEach(p => {
                const tl = p.getTotalLength();
                p.style.strokeDasharray = `${tl} ${tl}`;
                p.style.strokeDashoffset = '0';
            });
        }
    }
    
    feedbackContainer.classList.remove('hidden');
    feedbackContainer.className = `feedback ${isWin ? 'success' : 'error'}`;
    feedbackTitle.textContent = isWin ? 'Correct!' : 'Game Over!';
    
    const fullName = currentCircuit.fullName || currentCircuit.name;
    feedbackDesc.innerHTML = isWin 
        ? `You guessed it right. It's <strong>${currentCircuit.name}</strong>.`
        : `The correct answer was <strong>${currentCircuit.name}</strong>.<br><small>${fullName}</small><br><br>Final Streak: <strong>${score}</strong>`;
        
    btnNext.textContent = isWin ? 'Next Circuit' : 'Play Again';
    btnNext.onclick = isWin ? nextRound : () => startGame(currentMode);
}

function updateScore(newScore) {
    score = newScore;
    scoreDisplay.textContent = score;
}

async function loadAndDisplayCircuit(layout, mode) {
    const container = document.getElementById('circuit-svg-container');
    container.innerHTML = 'Loading...';
    try {
        const response = await fetch(`public/circuits/${layout}.svg`);
        const svgText = await response.text();
        container.innerHTML = svgText;
        const svg = container.querySelector('svg');
        if (!svg) return;
        
        let origViewBox = svg.getAttribute('viewBox');
        if (!origViewBox) {
            origViewBox = `0 0 ${svg.getAttribute('width') || 500} ${svg.getAttribute('height') || 500}`;
            svg.setAttribute('viewBox', origViewBox);
        }
        svg.dataset.origViewBox = origViewBox;
        svg.style.transition = 'viewBox 1s ease-in-out';
        
        // Remove existing styles to allow CSS to control it
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        
        const paths = svg.querySelectorAll('path');
        if (paths.length === 0) return;
        
        paths.forEach(p => {
            p.style.strokeDasharray = 'none';
            p.style.strokeDashoffset = '0';
        });
        
        if (mode === '3corners') {
            // Need to wait slightly for layout so path length is computable
            setTimeout(() => extractThreeCorners(svg, paths), 50);
        }
    } catch (err) {
        console.error('Failed to load SVG:', err);
        container.innerHTML = 'Error loading circuit.';
    }
}

function extractThreeCorners(svg, paths) {
    const mainPath = paths[0];
    const totalLength = mainPath.getTotalLength();
    if (totalLength === 0) return;
    
    const samples = 200;
    const points = [];
    for(let i=0; i<=samples; i++) {
        points.push(mainPath.getPointAtLength(i * totalLength / samples));
    }
    
    const angles = [];
    for(let i=0; i<samples-1; i++) {
        const dx = points[i+1].x - points[i].x;
        const dy = points[i+1].y - points[i].y;
        angles.push(Math.atan2(dy, dx));
    }
    
    const diffs = [];
    for(let i=0; i<angles.length-1; i++) {
        let diff = Math.abs(angles[i+1] - angles[i]);
        if (diff > Math.PI) diff = 2*Math.PI - diff;
        diffs.push(diff);
    }
    
    const windowSize = 3;
    const smoothed = [];
    for(let i=0; i<diffs.length; i++) {
        let sum = 0;
        let count = 0;
        for(let j = Math.max(0, i-windowSize); j <= Math.min(diffs.length-1, i+windowSize); j++) {
            sum += diffs[j];
            count++;
        }
        smoothed.push(sum / count);
    }
    
    const peaks = [];
    for(let i=1; i<smoothed.length-1; i++) {
        if (smoothed[i] > 0.15 && smoothed[i] > smoothed[i-1] && smoothed[i] > smoothed[i+1]) {
            peaks.push(i);
        }
    }
    
    const minDistance = samples * 0.05; 
    const corners = [];
    if (peaks.length > 0) {
        corners.push(peaks[0]);
        for(let i=1; i<peaks.length; i++) {
            if (peaks[i] - corners[corners.length-1] > minDistance) {
                corners.push(peaks[i]);
            } else if (smoothed[peaks[i]] > smoothed[corners[corners.length-1]]) {
                corners[corners.length-1] = peaks[i];
            }
        }
    }
    
    let startSample = 0;
    let endSample = samples * 0.25;
    
    if (corners.length >= 3) {
        const maxIdx = Math.max(0, corners.length - 3);
        const startCornerIdx = Math.floor(Math.random() * (maxIdx + 1));
        const endCornerIdx = startCornerIdx + 2;
        
        startSample = Math.max(0, corners[startCornerIdx] - Math.floor(samples * 0.05));
        endSample = Math.min(samples, corners[endCornerIdx] + Math.floor(samples * 0.05));
    } else {
        startSample = Math.floor(Math.random() * (samples * 0.75));
        endSample = startSample + Math.floor(samples * 0.25);
    }
    
    const minSamples = samples * 0.15;
    if (endSample - startSample < minSamples) {
        const deficit = minSamples - (endSample - startSample);
        startSample = Math.max(0, startSample - Math.floor(deficit / 2));
        endSample = Math.min(samples, startSample + minSamples);
    }
    
    const startLength = (startSample / samples) * totalLength;
    const endLength = (endSample / samples) * totalLength;
    const segLen = endLength - startLength;
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for(let i = Math.floor(startSample); i <= Math.ceil(endSample); i++) {
        const pt = mainPath.getPointAtLength(i * totalLength / samples);
        minX = Math.min(minX, pt.x);
        minY = Math.min(minY, pt.y);
        maxX = Math.max(maxX, pt.x);
        maxY = Math.max(maxY, pt.y);
    }
    
    const w = maxX - minX;
    const h = maxY - minY;
    const padX = Math.max(w * 0.2, 20);
    const padY = Math.max(h * 0.2, 20);
    
    svg.setAttribute('viewBox', `${minX - padX} ${minY - padY} ${w + 2*padX} ${h + 2*padY}`);
    
    paths.forEach(p => {
        const tl = p.getTotalLength();
        if (tl === 0) return;
        const pStart = (startLength / totalLength) * tl;
        const pSegLen = (segLen / totalLength) * tl;
        
        p.style.transition = 'none';
        p.style.strokeDasharray = `${pSegLen} ${tl}`;
        p.style.strokeDashoffset = `-${pStart}`;
        
        // Re-enable transition after a tiny delay so future animations work
        setTimeout(() => {
            p.style.transition = 'stroke-dasharray 1s ease-in-out, stroke-dashoffset 1s ease-in-out';
        }, 50);
    });
}

// Start
init();
