// Elements for the board game
const gameBoard = document.getElementById('game-board');
const rollDiceButton = document.getElementById('roll-dice');
const playerTurnIndicator = document.getElementById('player-turn');
const scoreBoard = document.getElementById('score-board');
const diceValueDisplay = document.getElementById('dice-value');

// Game Data
const categories = [
    "Erreurs historiques en science",
    "Inventions accidentelles",
    "Échecs dans l'espace",
    "Prédictions scientifiques erronées",
    "Société",
    "Bonus"
];

const players = [];
const numPlayers = 4; // Changeable for 2-6 players
let currentPlayerIndex = 0;

let questions = {};

// Fetch questions from JSON file
fetch('questions.json')
    .then(response => response.json())
    .then(data => {
        questions = data;
    })
    .catch(error => console.error('Error loading questions:', error));

// Create board structure
function createGameBoard() {
    const numCells = 30; // Example: 30 cells total
    const bonusPositions = [5, 15, 25]; // Example positions for Bonus cells
    for (let i = 0; i < numCells; i++) {
        const cell = document.createElement('div');
        cell.classList.add('board-cell');
        if (bonusPositions.includes(i)) {
            cell.dataset.category = "Bonus";
        } else {
            cell.dataset.category = categories[i % (categories.length - 1)];
        }
        gameBoard.appendChild(cell);
    }
}

// Add players to the game
function setupPlayers() {
    for (let i = 0; i < numPlayers; i++) {
        players.push({
            name: `Player ${i + 1}`,
            position: 0,
            cards: []
        });

        const scoreRow = document.createElement('div');
        scoreRow.innerHTML = `<span class="player-token-score player-${i}"></span>${players[i].name}: 0 cards`;
        scoreRow.id = `player-${i}-score`;
        scoreBoard.appendChild(scoreRow);

        // Create player token
        const token = document.createElement('div');
        token.classList.add('player-token', `player-${i}`);
        document.querySelector('.board-cell').appendChild(token);
    }
    playerTurnIndicator.textContent = `C'est au tour de ${players[0].name}`;
}

// Roll the dice and move the player
function rollDice() {
    rollDiceButton.disabled = true; // Disable the dice roll button
    const diceValue = Math.floor(Math.random() * 6) + 1;
    diceValueDisplay.textContent = diceValue;
    const currentPlayer = players[currentPlayerIndex];

    // Move player position
    currentPlayer.position = (currentPlayer.position + diceValue) % 30;

    // Update visuals
    updatePlayerPosition(currentPlayerIndex);
    triggerQuestion(currentPlayer.position, currentPlayerIndex);
}

// Trigger a question popup
function triggerQuestion(position, playerIndex) {
    const cell = document.querySelectorAll('.board-cell')[position];
    const category = cell.dataset.category;

    if (!category) {
        console.error('No category found for cell at position', position);
        rollDiceButton.disabled = false; // Re-enable the dice roll button
        return;
    }

    const questionData = questions[category];
    if (!questionData || questionData.length === 0) {
        console.error('No questions found for category', category);
        rollDiceButton.disabled = false; // Re-enable the dice roll button
        return;
    }

    const question = questionData[Math.floor(Math.random() * questionData.length)];
    
    const questionPopup = document.createElement('div');
    questionPopup.classList.add('question-popup');
    questionPopup.innerHTML = `
        <h2>${category}</h2>
        ${category === "Société" ? '<img src="img/society.svg" alt="Société">' : ''}
        ${category === "Échecs dans l'espace" ? '<img src="img/Space faileures.svg" alt="Échecs dans l\'espace">' : ''}
        ${category === "Erreurs historiques en science" ? '<img src="img/Mistakes in the History of Science.svg" alt="Erreurs historiques en science">' : ''}
        ${category === "Inventions accidentelles" ? '<img src="img/Accidental Inventions.svg" alt="Inventions accidentelles">' : ''}
        ${category === "Prédictions scientifiques erronées" ? '<img src="img/Inaccurate Scientific Predictions.svg" alt="Prédictions scientifiques erronées">' : ''}
        ${category === "Bonus" ? '<img src="img/Bonus.svg" alt="Bonus">' : ''}
        <p>${question.question}</p>
        <button onclick="answerQuestion(true, ${playerIndex}, ${question.answer}, ${category === 'Bonus'})">Vrai</button>
        <button onclick="answerQuestion(false, ${playerIndex}, ${question.answer}, ${category === 'Bonus'})">Faux</button>
    `;
    document.body.appendChild(questionPopup);
}

// Handle question response
function answerQuestion(playerAnswer, playerIndex, correctAnswer, isBonus) {
    const popup = document.querySelector('.question-popup');
    if (popup) popup.remove();

    const currentPlayer = players[playerIndex];
    const cell = document.querySelectorAll('.board-cell')[currentPlayer.position];

    if (playerAnswer === correctAnswer) {
        cell.classList.add('correct-answer');
        setTimeout(() => cell.classList.remove('correct-answer'), 1000);

        if (!currentPlayer.cards.includes(cell.dataset.category) && cell.dataset.category !== "Bonus") {
            currentPlayer.cards.push(cell.dataset.category);
            updateScore(playerIndex);

            // Check for win condition
            if (currentPlayer.cards.length === categories.length - 1) { // Exclude "Bonus" category
                alert(`${currentPlayer.name} a gagné en collectant toutes les cartes !`);
            }
        }

        if (isBonus) {
            alert("Bonne réponse! Vous pouvez relancer le dé.");
            rollDiceButton.disabled = false; // Re-enable the dice roll button
            rollDice();
            return;
        }
    } else {
        cell.classList.add('incorrect-answer');
        setTimeout(() => cell.classList.remove('incorrect-answer'), 1000);
    }

    // Update turn
    currentPlayerIndex = (currentPlayerIndex + 1) % numPlayers;
    playerTurnIndicator.textContent = `C'est au tour de ${players[currentPlayerIndex].name}`;
    rollDiceButton.disabled = false; // Re-enable the dice roll button
}

// Update player position on the board
function updatePlayerPosition(playerIndex) {
    const player = players[playerIndex];
    const cells = document.querySelectorAll('.board-cell');

    // Clear previous position
    cells.forEach(cell => {
        const token = cell.querySelector(`.player-${playerIndex}`);
        if (token) token.remove();
    });

    // Set new position
    const newCell = cells[player.position];
    const token = document.createElement('div');
    token.classList.add('player-token', `player-${playerIndex}`);
    newCell.appendChild(token);
}

// Update the score for a player
function updateScore(playerIndex) {
    const player = players[playerIndex];
    const scoreRow = document.getElementById(`player-${playerIndex}-score`);
    scoreRow.textContent = `${player.name}: ${player.cards.length} cartes`;
}

// Event Listeners
rollDiceButton.addEventListener('click', rollDice);

// Initialize game
createGameBoard();
setupPlayers();
