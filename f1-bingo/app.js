let driversData = [];
let allConditions = [];
let grid = { rows: [], cols: [] };

let usedDrivers = new Set();
let correctCells = 0;
let activeCell = null;
let cellFails = Array(3).fill().map(() => Array(3).fill(0));
let failedCells = 0;

// Elements
const gridContainer = document.getElementById('grid-container');
const statusSpan = document.getElementById('failed-cells');
const searchModal = document.getElementById('search-modal');
const driverSearch = document.getElementById('driver-search');
const searchResults = document.getElementById('search-results');
const closeSearchBtn = document.getElementById('close-search');
const gameOverModal = document.getElementById('game-over-modal');
const gameOverTitle = document.getElementById('game-over-title');
const playAgainBtn = document.getElementById('play-again-btn');

Papa.parse('driver_statistics.csv', {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
        processData(results.data);
        startGame();
    }
});

function removeDiacritics(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function processData(data) {
    let natCounts = {};
    let teamCounts = {};
    let yearCounts = {};
    
    data.forEach(row => {
        let teams = [];
        for (let i = 1; i <= 13; i++) {
            if (row[`Team_${i}`]) teams.push(row[`Team_${i}`]);
        }
        let years = [];
        for (let i = 1; i <= 22; i++) {
            if (row[`Year_${i}`]) years.push(row[`Year_${i}`]);
        }
        
        let driver = {
            name: row.Driver,
            nationality: row.Nationality,
            scoredPoint: row['Scored Point'],
            hadPodium: row['Had Podium'],
            wonRace: row['Won Race'],
            wonChampionship: row['Won Championship'],
            hadPolePosition: row['Had Pole Position'],
            hadFastestLap: row['Had Fastest Lap'],
            teams: teams,
            years: years
        };
        driversData.push(driver);
        
        // Count frequencies
        natCounts[driver.nationality] = (natCounts[driver.nationality] || 0) + 1;
        teams.forEach(t => teamCounts[t] = (teamCounts[t] || 0) + 1);
        years.forEach(y => yearCounts[y] = (yearCounts[y] || 0) + 1);
    });

    // Generate conditions
    for (let nat in natCounts) {
        if (natCounts[nat] >= 5 && nat !== 'Unknown') {
            allConditions.push({ type: 'nationality', value: nat, label: nat });
        }
    }
    for (let team in teamCounts) {
        if (teamCounts[team] >= 5) {
            allConditions.push({ type: 'team', value: team, label: team });
        }
    }
    for (let year in yearCounts) {
        if (yearCounts[year] >= 10) {
            allConditions.push({ type: 'year', value: year, label: `Raced in ${year}` });
        }
    }
    allConditions.push({ type: 'stat', value: 'wonRace', label: 'Won a Race' });
    allConditions.push({ type: 'stat', value: 'hadPodium', label: 'Scored a Podium' });
    allConditions.push({ type: 'stat', value: 'scoredPoint', label: 'Scored a Point' });
    allConditions.push({ type: 'stat', value: 'wonChampionship', label: 'World Champion' });
    allConditions.push({ type: 'stat', value: 'hadPolePosition', label: 'Pole Position' });
    allConditions.push({ type: 'stat', value: 'hadFastestLap', label: 'Fastest Lap' });

    let candidateTeammates = driversData.filter(d => d.years.length >= 10);
    candidateTeammates.forEach(d => {
        allConditions.push({ type: 'raced_with', value: d.name, years: d.years, label: `Championship in the same year as ${d.name}` });
    });
}

function matches(driver, condition) {
    if (condition.type === 'nationality') return driver.nationality === condition.value;
    if (condition.type === 'team') return driver.teams.includes(condition.value);
    if (condition.type === 'year') return driver.years.includes(condition.value);
    if (condition.type === 'stat') {
        if (condition.value === 'wonRace') return driver.wonRace === 'Y';
        if (condition.value === 'hadPodium') return driver.hadPodium === 'Y';
        if (condition.value === 'scoredPoint') return driver.scoredPoint === 'Y';
        if (condition.value === 'wonChampionship') return driver.wonChampionship === 'Y';
        if (condition.value === 'hadPolePosition') return driver.hadPolePosition === 'Y';
        if (condition.value === 'hadFastestLap') return driver.hadFastestLap === 'Y';
    }
    if (condition.type === 'raced_with') {
        return driver.name !== condition.value && driver.years.some(y => condition.years.includes(y));
    }
    return false;
}

function isGridSolvable(rows, cols, driversData) {
    let possible = [];
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            let cellDrivers = driversData.filter(d => matches(d, rows[r]) && matches(d, cols[c]));
            if (cellDrivers.length === 0) return false;
            possible.push(cellDrivers);
        }
    }
    
    let cells = possible.map((list, index) => ({ list, index }));
    cells.sort((a, b) => a.list.length - b.list.length);
    
    let usedNames = new Set();
    
    function backtrack(cellIndex) {
        if (cellIndex === 9) return true;
        
        let candidates = cells[cellIndex].list;
        for (let i = 0; i < candidates.length; i++) {
            let dName = candidates[i].name;
            if (!usedNames.has(dName)) {
                usedNames.add(dName);
                if (backtrack(cellIndex + 1)) return true;
                usedNames.delete(dName);
            }
        }
        return false;
    }
    
    return backtrack(0);
}

function generateGrid() {
    let attempts = 0;
    while (attempts < 15000) {
        attempts++;
        
        let typeCounts = { nationality: 0, team: 0, year: 0, stat: 0, raced_with: 0 };
        let selected = [];
        
        let shuffled = [...allConditions].sort(() => Math.random() - 0.5);
        
        function canAdd(c) {
            if (selected.includes(c)) return false;
            if (c.type === 'nationality' && typeCounts.nationality >= 1) return false;
            if (c.type === 'stat' && typeCounts.stat >= 1) return false;
            if (c.type === 'team' && typeCounts.team >= 2) return false;
            if (c.type === 'year' && typeCounts.year >= 2) return false;
            if (c.type === 'raced_with' && typeCounts.raced_with >= 1) return false;
            return true;
        }
        
        let rows = [];
        for (let c of shuffled) {
            if (canAdd(c)) {
                typeCounts[c.type]++;
                rows.push(c);
                selected.push(c);
                if (rows.length === 3) break;
            }
        }
        
        let cols = [];
        for (let c of shuffled) {
            if (canAdd(c)) {
                let ok = true;
                for (let r of rows) {
                    if (!driversData.some(d => matches(d, r) && matches(d, c))) {
                        ok = false;
                        break;
                    }
                }
                if (ok) {
                    typeCounts[c.type]++;
                    cols.push(c);
                    selected.push(c);
                    if (cols.length === 3) break;
                }
            }
        }
        
        if (rows.length === 3 && cols.length === 3) {
            if (isGridSolvable(rows, cols, driversData)) {
                return { rows, cols };
            }
        }
    }
    console.error("Failed to generate grid");
    return null;
}

function startGame() {
    grid = generateGrid();
    cellFails = Array(3).fill().map(() => Array(3).fill(0));
    failedCells = 0;
    usedDrivers.clear();
    correctCells = 0;
    updateStatus();
    renderGrid();
    gameOverModal.classList.add('hidden');
    searchModal.classList.add('hidden');
}

function renderGrid() {
    gridContainer.innerHTML = '';
    
    // Top-left empty
    let emptyCell = document.createElement('div');
    emptyCell.className = 'header-cell top-left-empty';
    gridContainer.appendChild(emptyCell);
    
    // Col headers
    for (let c = 0; c < 3; c++) {
        let cell = document.createElement('div');
        cell.className = 'header-cell';
        cell.textContent = grid.cols[c].label;
        gridContainer.appendChild(cell);
    }
    
    for (let r = 0; r < 3; r++) {
        // Row header
        let rowHeader = document.createElement('div');
        rowHeader.className = 'header-cell';
        rowHeader.textContent = grid.rows[r].label;
        gridContainer.appendChild(rowHeader);
        
        // Cells
        for (let c = 0; c < 3; c++) {
            let cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell-${r}-${c}`;
            cell.dataset.r = r;
            cell.dataset.c = c;
            
            let failsIndicator = document.createElement('div');
            failsIndicator.className = 'cell-fails';
            failsIndicator.id = `fails-${r}-${c}`;
            cell.appendChild(failsIndicator);
            
            cell.addEventListener('click', () => onCellClick(r, c));
            gridContainer.appendChild(cell);
        }
    }
}

function updateStatus() {
    statusSpan.textContent = failedCells;
    if (failedCells >= 3) {
        endGame(false);
    }
}

function onCellClick(r, c) {
    let cellEl = document.getElementById(`cell-${r}-${c}`);
    if (cellEl.classList.contains('correct') || cellEl.classList.contains('revealed')) return;
    if (failedCells >= 3) return;
    
    activeCell = { r, c };
    driverSearch.value = '';
    searchResults.innerHTML = '';
    searchModal.classList.remove('hidden');
    driverSearch.focus();
}

closeSearchBtn.addEventListener('click', () => {
    searchModal.classList.add('hidden');
});

driverSearch.addEventListener('input', (e) => {
    let q = removeDiacritics(e.target.value.toLowerCase().trim());
    searchResults.innerHTML = '';
    if (q.length < 2) return;
    
    let matchesDriver = driversData.filter(d => removeDiacritics(d.name.toLowerCase()).includes(q) && !usedDrivers.has(d.name));
    matchesDriver.slice(0, 10).forEach(d => {
        let li = document.createElement('li');
        li.textContent = d.name;
        li.addEventListener('click', () => submitGuess(d));
        searchResults.appendChild(li);
    });
});

function submitGuess(driver) {
    searchModal.classList.add('hidden');
    
    let r = activeCell.r;
    let c = activeCell.c;
    let rowCond = grid.rows[r];
    let colCond = grid.cols[c];
    
    let cellEl = document.getElementById(`cell-${r}-${c}`);
    
    if (matches(driver, rowCond) && matches(driver, colCond)) {
        // Correct
        usedDrivers.add(driver.name);
        cellEl.classList.add('correct');
        cellEl.innerHTML = driver.name;
        correctCells++;
        
        if (correctCells + failedCells >= 9) {
            if (failedCells < 3) endGame(true);
        }
    } else {
        // Wrong
        cellEl.classList.remove('wrong-anim');
        void cellEl.offsetWidth; // trigger reflow
        cellEl.classList.add('wrong-anim');
        
        cellFails[r][c]++;
        let failsIndicator = document.getElementById(`fails-${r}-${c}`);
        if (failsIndicator) failsIndicator.textContent = '❌'.repeat(cellFails[r][c]);
        
        if (cellFails[r][c] >= 3) {
            // Reveal cell
            let validDriver = driversData.find(d => matches(d, rowCond) && matches(d, colCond) && !usedDrivers.has(d.name));
            if (!validDriver) validDriver = driversData.find(d => matches(d, rowCond) && matches(d, colCond));
            
            if (validDriver) usedDrivers.add(validDriver.name);
            cellEl.classList.add('revealed');
            cellEl.innerHTML = validDriver ? validDriver.name : "N/A";
            failedCells++;
            updateStatus();
            
            if (correctCells + failedCells >= 9 && failedCells < 3) {
                endGame(true);
            }
        }
    }
}

function endGame(win) {
    if (win) {
        gameOverTitle.textContent = "You Win!";
    } else {
        gameOverTitle.textContent = "Game Over!";
        
        // Reveal all remaining empty cells
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                let cellEl = document.getElementById(`cell-${r}-${c}`);
                if (!cellEl.classList.contains('correct') && !cellEl.classList.contains('revealed')) {
                    let validDriver = driversData.find(d => matches(d, grid.rows[r]) && matches(d, grid.cols[c]) && !usedDrivers.has(d.name));
                    if (!validDriver) validDriver = driversData.find(d => matches(d, grid.rows[r]) && matches(d, grid.cols[c]));
                    
                    if (validDriver) usedDrivers.add(validDriver.name);
                    cellEl.classList.add('revealed');
                    cellEl.innerHTML = validDriver ? validDriver.name : "N/A";
                }
            }
        }
    }
    gameOverModal.classList.remove('hidden');
}

playAgainBtn.addEventListener('click', () => {
    startGame();
});
