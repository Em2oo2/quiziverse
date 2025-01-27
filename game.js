// Elements for the board game
const gameBoard = document.getElementById('game-board');
const rollDiceButton = document.getElementById('roll-dice');
const scoreBoard = document.getElementById('score-board');
const moveMessage = document.getElementById('move-message'); // Add reference to move message

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
        if (i !== 29) { // Do not add an arrow to the last cell
            const arrow = document.createElement('div');
            arrow.classList.add('direction-arrow');
        
            if (i === 23) { // Special case for cell 24
                arrow.classList.add('left-arrow');
            } else if (i < 5) { // First row: right arrows
                arrow.classList.add('right-arrow');
            } else if (i === 5 || i === 6 || i === 17 || i === 18) { // Last cell of each row except the last row
                arrow.classList.add('down-arrow');
            } else if (i === 11 || (i >= 7 && i <= 10) || (i >= 18 && i <= 22)) { // Second and fourth rows: left arrows
                arrow.classList.add('left-arrow');
            } else if (i >= 12 && i <= 16 || i <= 28) { // Third and fifth rows: right arrows
                arrow.classList.add('right-arrow');
            }
        
            cell.appendChild(arrow); // Add arrow to the cell
        }
        
        
        else {
            cell.dataset.category = "Final";
        }
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
    updatePlayerTurnMessage();
}

// Update the player turn message
function updatePlayerTurnMessage() {
    const currentPlayer = players[currentPlayerIndex];
    document.getElementById('roll-dice-message').innerHTML = `
        <i class="fas fa-arrow-left"></i>
        <span>Lance le dé ${currentPlayer.name}</span>
    `;
}

// Roll the dice and move the player
function rollDice() {
    rollDiceButton.disabled = true; // Disable the dice roll button
    rollDiceButton.classList.add('rolling'); // Add rolling class for animation

    const diceValue = Math.floor(Math.random() * 6) + 1;
    rollDiceButton.classList.remove('rolling'); // Remove rolling class after animation

    const currentPlayer = players[currentPlayerIndex];

    // Hide the "Lance le dé" message
    document.getElementById('roll-dice-message').style.display = 'none';

    // Update the move message
    moveMessage.textContent = `Tu avances de ${diceValue} cases, ${currentPlayer.name}`;

    // Calculate the number of spaces left to the final cell
    const currentPos = customMovementOrder.indexOf(currentPlayer.position);
    const spacesLeft = 29 - currentPos;

    // Move player position
    movePlayer(currentPlayerIndex, Math.min(diceValue, spacesLeft));
}

// Custom token movement order based on your board layout
const customMovementOrder = [
    0, 1, 2, 3, 4, 5,    // First row: left-to-right
    11, 10, 9, 8, 7, 6,  // Second row: right-to-left
    12, 13, 14, 15, 16, 17, // Third row: left-to-right
    23, 22, 21, 20, 19, 18, // Fourth row: right-to-left
    24, 25, 26, 27, 28, 29  // Fifth row: left-to-right
];

// Move player token step by step based on the custom order
function movePlayer(playerIndex, steps) {
    const player = players[playerIndex];
    let currentStep = 0;

    const interval = setInterval(() => {
        if (currentStep < steps) {
            // Determine the new position based on the custom movement order
            const currentPos = player.position === -1 ? -1 : customMovementOrder.indexOf(player.position);
            const nextPos = (currentPos + 1) % customMovementOrder.length;
            player.position = customMovementOrder[nextPos];

            updatePlayerPosition(playerIndex);
            currentStep++;

            // Check if the player has reached the final cell
            if (player.position === 29) {
                clearInterval(interval);
                showCustomPopup(`${player.name} a atteint la fin du plateau! La partie est terminée.`, checkForWinner);
                return;
            }
        } else {
            clearInterval(interval);

            // Trigger question for the new position
            triggerQuestion(player.position, playerIndex);
        }
    }, 500); // Adjust the interval duration for smoother movement
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
                rollDiceButton.disabled = false; // Re-enable the dice roll button
            });
        } else {
            showCustomPopup("Expérience ratée! Vous n'avez pas de carte à perdre.", () => {
                // Update turn to the next player
                currentPlayerIndex = (currentPlayerIndex + 1) % numPlayers;
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
                updatePlayerTurnMessage(); // Update the player turn message
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
                rollDiceButton.disabled = false; // Re-enable the dice roll button
                updatePlayerTurnMessage(); // Update the player turn message
                // Show the "Lance le dé" message
                document.getElementById('roll-dice-message').style.display = 'flex';
                moveMessage.textContent = ''; // Clear the move message
            });
            return;
        }
    }

    // Update turn
    currentPlayerIndex = (currentPlayerIndex + 1) % numPlayers;
    rollDiceButton.disabled = false; // Re-enable the dice roll button
    updatePlayerTurnMessage(); // Update the player turn message
    // Show the "Lance le dé" message
    document.getElementById('roll-dice-message').style.display = 'flex';
    moveMessage.textContent = ''; // Clear the move message
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

        // Show the "lancez le dé" message
        document.getElementById('roll-dice-message').style.display = 'flex';
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
            "Expérience ratée": "fa-times" // Change to "x" mark icon
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
