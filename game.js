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
    "Bonus",
    "Expérience réussie",
    "Expérience ratée"
];

const players = [];
let numPlayers = 4; // Default value, will be updated
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
    const specialCategories = ["Bonus", "Expérience réussie", "Expérience ratée"];
    for (let i = 0; i < numCells; i++) {
        const cell = document.createElement('div');
        cell.classList.add('board-cell');
        if (bonusPositions.includes(i)) {
            cell.dataset.category = specialCategories[i % specialCategories.length];
        } else {
            cell.dataset.category = categories[i % (categories.length - specialCategories.length)];
        }
        // Add arrow to indicate direction
        const arrow = document.createElement('div');
        arrow.classList.add('direction-arrow');
        if (i < 5) { // First line of the board
            arrow.classList.add('right-arrow');
        } else if (i === 5) { // Last cell of the first line
            arrow.classList.add('down-arrow');
        } else if (i >= 6 && i < 12 && (i % 2 !== 0 || (i >= 8 && i <= 10))) { // Second line of the board
            arrow.classList.add('left-arrow');
        } else if (i >= 12 && i < 17) { // Third line of the board
            arrow.classList.add('right-arrow');
        } else if (i === 17) { // Last cell of the third line
            arrow.classList.add('down-arrow');
        } else if (i === 18) { // First cell of the fourth line
            arrow.classList.add('down-arrow');
        } else if (i > 18 && i < 23) { // Fourth line of the board
            arrow.classList.add('left-arrow');
        } else if (i === 23) { // Last cell of the fourth line
            arrow.classList.add('left-arrow');
        } else if (i >= 24 && i < 30) { // Fifth line of the board
            arrow.classList.add('right-arrow');
        }
        cell.appendChild(arrow);
        gameBoard.appendChild(cell);
    }
}

// Add players to the game
function setupPlayers() {
    const urlParams = new URLSearchParams(window.location.search);
    numPlayers = parseInt(urlParams.get('numPlayers'));
    for (let i = 0; i < numPlayers; i++) {
        const playerName = urlParams.get(`player${i + 1}`);
        players.push({
            name: playerName || `Player ${i + 1}`,
            position: -1, // Start position off the board
            cards: []
        });

        const scoreRow = document.createElement('div');
        scoreRow.classList.add('player-score');
        scoreRow.innerHTML = `<span class="player-token-score player-${i}"></span><span class="player-${i}-name">${players[i].name}</span>: 0`;
        scoreRow.id = `player-${i}-score`;
        scoreBoard.appendChild(scoreRow);

        // Create player token off the board
        const token = document.createElement('div');
        token.classList.add('player-token', `player-${i}`);
        gameBoard.parentElement.appendChild(token); // Append to the game board container
        token.style.left = '-40px'; // Position to the left of the first cell
        token.style.top = 'calc(50% - 15px)'; // Center vertically
    }
    playerTurnIndicator.textContent = `À toi de jouer ${players[0].name}`;
}

// Roll the dice and move the player
function rollDice() {
    rollDiceButton.disabled = true; // Disable the dice roll button
    const diceValue = Math.floor(Math.random() * 6) + 1;
    diceValueDisplay.textContent = diceValue;
    const currentPlayer = players[currentPlayerIndex];

    // Move player position
    if (currentPlayer.position + diceValue >= 29) {
        currentPlayer.position = 29;
    } else {
        currentPlayer.position = (currentPlayer.position + diceValue) % 30;
    }

    // Update visuals
    updatePlayerPosition(currentPlayerIndex);

    // Check if the player has reached the final cell (bottom right corner)
    if (currentPlayer.position === 29) {
        showCustomPopup(`${currentPlayer.name} a atteint la fin du plateau! La partie est terminée.`, checkForWinner);
        return; // End the game immediately
    }

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

    if (category === "Expérience réussie") {
        const currentPlayer = players[playerIndex];
        if (!currentPlayer.cards.includes(category)) {
            currentPlayer.cards.push(category);
            updateScore(playerIndex);
            showCustomPopup("Expérience réussie! Vous avez gagné une carte et vous pouvez relancer le dé.", () => {
                rollDiceButton.disabled = false; // Re-enable the dice roll button
            });
        } else {
            showCustomPopup("Expérience réussie! Vous pouvez relancer le dé.", () => {
                rollDiceButton.disabled = false; // Re-enable the dice roll button
            });
        }
        return;
    }

    if (category === "Expérience ratée") {
        const currentPlayer = players[playerIndex];
        if (currentPlayer.cards.length > 0) {
            currentPlayer.cards.pop();
            updateScore(playerIndex);
            showCustomPopup("Expérience ratée! Vous avez perdu une carte !", () => {
                // Update turn to the next player
                currentPlayerIndex = (currentPlayerIndex + 1) % numPlayers;
                playerTurnIndicator.textContent = `À toi de jouer ${players[currentPlayerIndex].name}`;
                rollDiceButton.disabled = false; // Re-enable the dice roll button
            });
        } else {
            showCustomPopup("Expérience ratée! Vous n'avez pas de carte à perdre.", () => {
                // Update turn to the next player
                currentPlayerIndex = (currentPlayerIndex + 1) % numPlayers;
                playerTurnIndicator.textContent = `À toi de jouer ${players[currentPlayerIndex].name}`;
                rollDiceButton.disabled = false; // Re-enable the dice roll button
            });
        }
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
        ${category === "Société" ? '<img src="img/Society.svg" alt="Société">' : ''}
        ${category === "Échecs dans l'espace" ? '<img src="img/Space Failures.svg" alt="Échecs dans l\'espace">' : ''}
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
    if (popup) {
        if (playerAnswer === correctAnswer) {
            popup.classList.add('correct-answer-blink');
        } else {
            popup.classList.add('incorrect-answer-blink');
        }
        setTimeout(() => popup.remove(), 1000);
    }

    const currentPlayer = players[playerIndex];
    const cell = document.querySelectorAll('.board-cell')[currentPlayer.position];

    // Debugging log
    console.log(`Player Answer: ${playerAnswer}, Correct Answer: ${correctAnswer}`);

    if (playerAnswer === correctAnswer) {
        cell.classList.add('correct-answer');
        setTimeout(() => cell.classList.remove('correct-answer'), 1000);

        // Allow multiple cards of the same category
        currentPlayer.cards.push(cell.dataset.category);
        updateScore(playerIndex);

        if (isBonus) {
            if (!currentPlayer.cards.includes("Bonus")) {
                currentPlayer.cards.push("Bonus");
                updateScore(playerIndex);
            }
            showCustomPopup("Bonne réponse! Vous avez gagné une carte Bonus et vous pouvez relancer le dé.", () => {
                rollDiceButton.disabled = false; // Re-enable the dice roll button
            });
            return;
        }
    } else {
        cell.classList.add('incorrect-answer');
        setTimeout(() => cell.classList.remove('incorrect-answer'), 1000);

        if (cell.dataset.category === "Expérience ratée" && currentPlayer.cards.length > 0) {
            currentPlayer.cards.pop();
            updateScore(playerIndex);
            showCustomPopup("Vous avez perdu une carte !", () => {
                // Update turn to the next player
                currentPlayerIndex = (currentPlayerIndex + 1) % numPlayers;
                playerTurnIndicator.textContent = `À toi de joueur ${players[currentPlayerIndex].name}`;
                rollDiceButton.disabled = false; // Re-enable the dice roll button
            });
            return;
        }
    }

    // Update turn
    currentPlayerIndex = (currentPlayerIndex + 1) % numPlayers;
    playerTurnIndicator.textContent = `À toi de jouer ${players[currentPlayerIndex].name}`;
    rollDiceButton.disabled = false; // Re-enable the dice roll button
}

// Show custom popup
function showCustomPopup(message, callback) {
    const popup = document.createElement('div');
    popup.classList.add('custom-popup');
    popup.innerHTML = `
        <p>${message}</p>
        <button onclick="closeCustomPopup()">OK</button>
    `;
    document.body.appendChild(popup);

    function closeCustomPopup() {
        popup.remove();
        if (callback) callback();
    }

    // Attach the closeCustomPopup function to the button
    popup.querySelector('button').addEventListener('click', closeCustomPopup);
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
    if (player.position >= 0) {
        const newCell = cells[player.position];
        const token = document.createElement('div');
        token.classList.add('player-token', `player-${playerIndex}`);

        // Check for existing tokens in the same cell
        const existingTokens = newCell.querySelectorAll('.player-token');
        const offset = existingTokens.length * 10; // Adjust offset as needed
        token.style.transform = `translate(${offset}px, ${offset}px)`;

        newCell.appendChild(token);
    } else {
        // Position off the board
        const token = document.querySelector(`.player-token.player-${playerIndex}`);
        token.style.left = '-40px'; // Position to the left of the first cell
        token.style.top = 'calc(50% - 15px)'; // Center vertically
    }
}

// Update the score for a player
function updateScore(playerIndex) {
    const player = players[playerIndex];
    const scoreRow = document.getElementById(`player-${playerIndex}-score`);
    const cardImages = player.cards.map(card => {
        const cardImageMap = {
            "Erreurs historiques en science": "Mistakes in the History of Science.svg",
            "Inventions accidentelles": "Accidental Inventions.svg",
            "Échecs dans l'espace": "Space Failures.svg",
            "Prédictions scientifiques erronées": "Inaccurate Scientific Predictions.svg",
            "Société": "Society.svg",
            "Bonus": "Bonus.svg",
            "Expérience réussie": "fa-thumbs-up",
            "Expérience ratée": "failure.svg"
        };
        if (card === "Expérience réussie") {
            return `<i class="fas ${cardImageMap[card]} card-icon"></i>`;
        } else {
            return `<img src="img/${cardImageMap[card]}" alt="${card}" class="card-icon">`;
        }
    }).join(' ');
    scoreRow.innerHTML = `<span class="player-token-score player-${playerIndex}"></span><span class="player-${playerIndex}-name">${player.name}</span>: ${player.cards.length} ${cardImages}`;
}

// Check for the winner
function checkForWinner() {
    let winner = players[0];
    for (let i = 1; i < players.length; i++) {
        if (players[i].cards.length > winner.cards.length) {
            winner = players[i];
        } else if (players[i].cards.length === winner.cards.length && players[i].position === 29 && winner.position !== 29) {
            winner = players[i];
        }
    }

    // Sort players by the number of cards they have, and by who reached the end first
    const ranking = players.slice().sort((a, b) => {
        if (b.cards.length === a.cards.length) {
            return b.position === 29 ? 1 : -1;
        }
        return b.cards.length - a.cards.length;
    });

    // Create the winner popup
    const winnerPopup = document.createElement('div');
    winnerPopup.classList.add('winner-popup');
    winnerPopup.innerHTML = `
        <h2>Le vainqueur est ${winner.name} avec ${winner.cards.length} cartes!</h2>
        <h3>Classement:</h3>
        <ul>
            ${ranking.map(player => {
                const cardImages = player.cards.map(card => {
                    const cardImageMap = {
                        "Erreurs historiques en science": "Mistakes in the History of Science.svg",
                        "Inventions accidentelles": "Accidental Inventions.svg",
                        "Échecs dans l'espace": "Space Failures.svg",
                        "Prédictions scientifiques erronées": "Inaccurate Scientific Predictions.svg",
                        "Société": "Society.svg",
                        "Bonus": "Bonus.svg",
                        "Expérience réussie": "fa-thumbs-up",
                        "Expérience ratée": "failure.svg"
                    };
                    if (card === "Expérience réussie") {
                        return `<i class="fas ${cardImageMap[card]} card-icon"></i>`;
                    } else {
                        return `<img src="img/${cardImageMap[card]}" alt="${card}" class="card-icon">`;
                    }
                }).join(' ');
                return `<li>${player.name}: ${player.cards.length} ${cardImages}</li>`;
            }).join('')}
        </ul>
        <button id="replay-button">Rejouer</button>
    `;
    document.body.appendChild(winnerPopup);

    // Attach the replayGame function to the button
    document.getElementById('replay-button').addEventListener('click', replayGame);
}

// Replay the game
function replayGame() {
    window.location.reload();
}

// Event Listeners
rollDiceButton.addEventListener('click', rollDice);

// Initialize game
createGameBoard();
setupPlayers();
