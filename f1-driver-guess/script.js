let targetDriver = null;
let guessCount = 0;

const input = document.getElementById('driver-input');
const autocompleteList = document.getElementById('autocomplete-list');
const guessesContainer = document.getElementById('guesses-container');
const guessCountSpan = document.getElementById('guess-count');
const winMessage = document.getElementById('win-message');
const playAgainBtn = document.getElementById('play-again-btn');

function normalizeString(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function initGame() {
    targetDriver = drivers[Math.floor(Math.random() * drivers.length)];
    guessCount = 0;
    guessCountSpan.textContent = guessCount;
    guessesContainer.innerHTML = '';
    winMessage.classList.add('hidden');
    input.value = '';
    input.disabled = false;
    input.focus();
    // For debugging, we can log the target driver
    // console.log("Target driver:", targetDriver.name);
}

// Autocomplete logic
input.addEventListener('input', function() {
    const val = normalizeString(this.value);
    closeAllLists();
    if (!val) return false;
    
    const filtered = drivers.filter(d => normalizeString(d.name).includes(val));
    
    filtered.forEach(driver => {
        const item = document.createElement('div');
        // Highlight matching text (simplified)
        item.innerHTML = driver.name;
        item.addEventListener('click', function() {
            input.value = driver.name;
            closeAllLists();
            makeGuess(driver);
        });
        autocompleteList.appendChild(item);
    });
});

function closeAllLists() {
    while (autocompleteList.firstChild) {
        autocompleteList.removeChild(autocompleteList.firstChild);
    }
}

document.addEventListener('click', function(e) {
    if (e.target !== input) {
        closeAllLists();
    }
});

input.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const val = normalizeString(this.value);
        const driver = drivers.find(d => normalizeString(d.name) === val);
        if (driver) {
            closeAllLists();
            makeGuess(driver);
        } else {
            // Check if there is an autocomplete suggestion
            const firstSuggestion = autocompleteList.firstChild;
            if (firstSuggestion) {
                firstSuggestion.click();
            }
        }
    }
});

function makeGuess(guessedDriver) {
    input.value = '';
    guessCount++;
    guessCountSpan.textContent = guessCount;

    const row = document.createElement('div');
    row.className = 'guess-row';

    // 1. Driver image
    const imgCell = document.createElement('div');
    imgCell.className = 'guess-cell';
    imgCell.style.padding = '0';
    if(guessedDriver.image) {
        const img = document.createElement('img');
        img.src = guessedDriver.image;
        img.className = 'driver-image';
        // Handle image errors
        img.onerror = () => { img.style.display = 'none'; imgCell.textContent = guessedDriver.name.substring(0, 3); };
        imgCell.appendChild(img);
    } else {
        imgCell.textContent = guessedDriver.name.substring(0, 3);
    }
    imgCell.title = guessedDriver.name;
    row.appendChild(imgCell);

    // Categories to compare
    const categories = ['firstYear', 'lastYear', 'wcs', 'wins', 'podiums', 'points', 'poles', 'gps'];
    
    let allCorrect = true;

    categories.forEach(cat => {
        const cell = document.createElement('div');
        cell.className = 'guess-cell';
        
        const guessedValue = guessedDriver[cat];
        const targetValue = targetDriver[cat];

        if (guessedValue === targetValue) {
            cell.classList.add('correct');
            cell.textContent = guessedValue;
        } else {
            allCorrect = false;
            const arrow = document.createElement('div');
            arrow.className = 'arrow';
            arrow.innerHTML = targetValue > guessedValue ? '▲' : '▼';
            cell.appendChild(arrow);
            
            const valText = document.createElement('div');
            valText.textContent = guessedValue;
            cell.appendChild(valText);
        }
        row.appendChild(cell);
    });

    // Add to top of container
    guessesContainer.insertBefore(row, guessesContainer.firstChild);

    if (allCorrect) {
        handleWin();
    }
}

function handleWin() {
    input.disabled = true;
    winMessage.classList.remove('hidden');
}

playAgainBtn.addEventListener('click', initGame);

// Start game
fetch('../shared/driver_images.json?t=' + new Date().getTime())
    .then(res => res.json())
    .then(images => {
        drivers.forEach(d => {
            if (images[d.name]) {
                d.image = images[d.name];
            }
        });
        initGame();
    })
    .catch(err => {
        console.error("Error loading images:", err);
        initGame();
    });
