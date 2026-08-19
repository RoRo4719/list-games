// Script Variables
let entries = [];
let startButton = document.querySelector("#startButton");
let playAgainButton = document.querySelector("#playAgain")
let gameInput = document.querySelector("#gameInput");
let timeLeft;
let timerId;
let scoreDisplay = document.querySelector("#scoreDisplay");
let entriesDisplay = document.querySelector("#entries");
let timerDisplay = document.querySelector("#timerDisplay");
let finalScore = document.querySelector("#finalScore");
let fullList = document.querySelector("#fullList");
let duplicateWarning = document.querySelector("#duplicate-warning");
let copyListButton = document.querySelector("#copyList");
let copyFeedback = document.querySelector("#copy-feedback");
let invalidGameWarning = document.querySelector("#invalid-game-warning");
let officialTitleToggle = false;
let titleToggle = document.querySelector("#titleToggle");
let settingsButton = document.querySelector("#settingsButton");
let saveSettingsButton = document.querySelector("#saveSettings");
let settingsPanel = document.querySelector("#settingsPanel");
let timeLimitInput = document.querySelector("#timeLimitInput");
let bonusInput = document.querySelector("#bonusInput");

// Game Settings Variables
let gameSettings = {
    timeLimit: 1,
    timeBonusPerEntry: 4
};

//Game State
const GAME_STATES = {
    ONBOARDING: "onboarding",
    READY: "readyToPlay",
    PLAYING: "playing",
    GAME_OVER: "gameOver"
};

let gameState = GAME_STATES.ONBOARDING;

console.log(gameState);

function changeGameState(newState) {
gameState = newState;

hideElement("onboarding");
hideElement("game")
hideElement("game-over")

    if (gameState === GAME_STATES.ONBOARDING) {       
        showElement("onboarding");

    } else if (gameState === GAME_STATES.READY) {
        showElement("game");

    } else if (gameState === GAME_STATES.PLAYING) {
        showElement("game");

    } else if (gameState === GAME_STATES.GAME_OVER) {
        showElement("game-over");
    }

console.log(gameState);
updateRefreshProtection();
}

function updateRefreshProtection() {
    if (gameState === GAME_STATES.PLAYING) {
        window.onbeforeunload = function(event) {
            event.preventDefault();
            event.returnValue = "";
        };
    } else {
        window.onbeforeunload = null;
    }
}

function initializeGame() {
    entries = [];
    clearInput();

    entriesDisplay.textContent = "";
    fullList.textContent = "";
    scoreDisplay.textContent = 0;
    finalScore.textContent = 0;
    timerDisplay.textContent = formatTime(gameSettings.timeLimit);
    duplicateWarning.textContent = "";
    duplicateWarning.classList.remove("show");
    timerDisplay.classList.remove("timer-warning");
    copyFeedback.textContent = "";
    invalidGameWarning.textContent = "";
    invalidGameWarning.classList.remove("show");
    officialTitleToggle = false;
    titleToggle.checked = false
}

//Intialize game by setting values to default and clearing information
initializeGame();

function onboarding() {
    changeGameState(GAME_STATES.ONBOARDING);
}

// Functions to toggle visibility of HTML
function hideElement(elementId) {
    const element = document.querySelector("#" + elementId);
    element.classList.add("hidden");
}

function showElement(elementId) {
    const element = document.querySelector("#" + elementId);
    element.classList.remove("hidden");
}

function clearInput() {
    gameInput.value = "";
}

// Settings Button
settingsButton.addEventListener("click", function() {
    settingsPanel.classList.toggle("hidden");

    if (!settingsPanel.classList.contains("hidden")) {
        timeLimitInput.value = gameSettings.timeLimit;
        bonusInput.value = gameSettings.timeBonusPerEntry;
    }
    
});

// Save Settings Button
saveSettingsButton.addEventListener("click", function() {

    gameSettings.timeLimit = Number(timeLimitInput.value);
    gameSettings.timeBonusPerEntry = Number(bonusInput.value);

    settingsPanel.classList.add("hidden");
});

// Show starting time before submitting first game
function showStartingTime() {
    timerDisplay.textContent = formatTime(gameSettings.timeLimit);
}

// Hide onboarding, show game elements, shift cursor focus to input, show starting time
function showReadyScreen() {
    changeGameState(GAME_STATES.READY);
    gameInput.focus();
    showStartingTime();
}

// Submitting games, starting timer, checking duplicates, adding to list
async function submitGame() {
    if (gameState !== GAME_STATES.READY && gameState !== GAME_STATES.PLAYING) {
        return;
    }
    
    let normalizedInput = gameInput.value.toLowerCase().trim();

    let alreadyListed = entries.some(entry => entry.normalized === normalizedInput);
    
    if (alreadyListed) {
        dupeGameWarning()
        return;
    }
    
    if (gameInput.value !== "") {
        
        let processedData = await checkGameDatabase(normalizedInput);

        if (!processedData.isValid) {
            invGameWarning();
            return;
        }

        duplicateWarning.classList.remove("show");

        entries.push({
            display: gameInput.value,
            normalized: normalizedInput,
            officialTitle: processedData.matchedGame.name
        });
            
        playEntrySound();
        renderScore();
        
        if (entries.length === 1) {
            changeGameState(GAME_STATES.PLAYING);
            startTimer();

        } else {
            addBonusTime();
        }

        renderLiveList(entries[entries.length - 1]);

        clearInput()
    }
}

// Check input against game database
async function checkGameDatabase(gameName) {
    let response = await fetch(
        "https://list-games.onrender.com/?game=" + encodeURIComponent(gameName)
    );
    
    let data = await response.json();

    return {
        isValid: data.valid,
        matchedGame: data.matchedGame
    };
}

function invGameWarning() {
    invalidGameWarning.textContent = "Not a game!";
    invalidGameWarning.classList.add("show");
}

// Warning text for duplicate game input
function dupeGameWarning() {
    duplicateWarning.textContent = "Game already listed!";
    duplicateWarning.classList.add("show");
    gameInput.focus();
}

// Render score
function renderScore() {
    scoreDisplay.textContent = entries.length;
}

// Render growing list during game
function renderLiveList(entry) {
    let entryWrapper = document.createElement("div");
    entryWrapper.classList.add("entry");

    let displayTitle = document.createElement("p");
    displayTitle.textContent = entry.display;
    displayTitle.classList.add("display-title");

    entryWrapper.appendChild(displayTitle);

    entriesDisplay.appendChild(entryWrapper);

}

// Function to start countdown timer
function startTimer() {
    timeLeft = gameSettings.timeLimit;
    renderTimer();

    timerId = setInterval(function() {
    timeLeft -= 1;
    renderTimer();

    if (timeLeft === 0) {
        clearInterval(timerId);
        endGame();
    }
    }, 1000);
}

// Adds bonus time per valid game entry after first game
function addBonusTime() {
    timeLeft = timeLeft + gameSettings.timeBonusPerEntry;
    renderTimer();
}

// Formats seconds into time format, e.g: 61 seconds -> 1:01
function formatTime(timeToFormat) {
    let minutes = Math.floor(timeToFormat / 60);
    let seconds = timeToFormat % 60;
    
    seconds = seconds.toString().padStart(2, "0");
    
    return minutes + ":" + seconds;
}

// Play entry sound
function playEntrySound() {
    const audioContext = new AudioContext();

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 700;

    gain.gain.setValueAtTime(0.08, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.08
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.08);
}

// Renders timer and timer warning UI
function renderTimer() {
    timerDisplay.textContent = formatTime(timeLeft);

    if (timeLeft <= 10) {
        timerDisplay.classList.add("timer-warning");
    } else {
        timerDisplay.classList.remove("timer-warning");
    }
}

// Ends game and shows full list and copy list and play again buttons
function endGame() { 
    changeGameState(GAME_STATES.GAME_OVER);
    finalScore.textContent = entries.length;
    renderFullList(); 
}

// Render full list for game over display
function renderFullList() {
    fullList.textContent = "";
    
    for (let entry of entries) {
        let paragraph = document.createElement("p");

        if (officialTitleToggle) {
            paragraph.textContent = entry.officialTitle;
            paragraph.classList.add("official-title");
        } else {
        paragraph.textContent = entry.display;
        }

        fullList.appendChild(paragraph);
    }
}

// Copies list of games at game over
async function copyList() {
    
    let copyEntries = entries
        .map(entry => officialTitleToggle ? entry.officialTitle : entry.display)
        .join("\n");

    await navigator.clipboard.writeText(copyEntries);   
    copyFeedback.textContent = "Copied!";
    copyFeedback.classList.add("show");
}

// Resets game
function resetGame() {
    initializeGame();
    onboarding();
}

// Start button 
startButton.addEventListener("click", function() {
    showReadyScreen();
});

// Submit game via enter key
gameInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        submitGame();
    }
});

gameInput.addEventListener("input", () => {
    if (duplicateWarning.classList.contains("show")) {
        duplicateWarning.classList.remove("show");
    }
    if (invalidGameWarning.classList.contains("show")) {
        invalidGameWarning.classList.remove("show");
    }
});

// Copy List button
copyListButton.addEventListener("click", function() {
    copyList();
    console.log("List Copied!")
});

// Title toggle checkbox
titleToggle.addEventListener("change", function() {
    officialTitleToggle = titleToggle.checked;
    renderFullList();
})

// Play again button
playAgainButton.addEventListener("click", function() {
    resetGame();
})

//Reminder: Make a feature to give the user a prompt if they accidentally hit refresh during game or game-over state
//(stay on page, leave page)