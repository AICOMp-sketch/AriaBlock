document.addEventListener('DOMContentLoaded', () => {
            // Game constants
            const BOARD_WIDTH = 10;
            const BOARD_HEIGHT = 20;
            const BLOCK_SIZE = 30;
            const COLORS = [
                null,
                '#FF0D72', // I
                '#0DC2FF', // J
                '#0DFF72', // L
                '#F538FF', // O
                '#FF8E0D', // S
                '#FFE138', // T
                '#3877FF'  // Z
            ];
            
            // Game variables
            let board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
            let currentPiece = null;
            let nextPiece = null;
            let score = 0;
            let level = 1;
            let gameInterval = null;
            let isPaused = false;
            let isGameOver = false;
            let dropCounter = 0;
            let lastTime = 0;
            let dropInterval = 1000;
            
            // DOM elements
            const gameBoard = document.getElementById('game-board');
            const nextPieceDisplay = document.getElementById('next-piece');
            const scoreDisplay = document.getElementById('score');
            const levelDisplay = document.getElementById('level');
            const startBtn = document.getElementById('start-btn');
            const restartBtn = document.getElementById('restart-btn');
            const gameOverDisplay = document.getElementById('game-over');
            const finalScoreDisplay = document.getElementById('final-score');
            
            // Initialize the game board
            function initializeBoard() {
                gameBoard.innerHTML = '';
                
                // Create cells for the game board
                for (let row = 0; row < BOARD_HEIGHT; row++) {
                    for (let col = 0; col < BOARD_WIDTH; col++) {
                        const cell = document.createElement('div');
                        cell.classList.add('cell', 'block');
                        cell.style.gridRow = row + 1;
                        cell.style.gridColumn = col + 1;
                        
                        // Assign a data attribute for easier access
                        cell.dataset.row = row;
                        cell.dataset.col = col;
                        
                        gameBoard.appendChild(cell);
                    }
                }
            }
            
            // Tetrominoes shapes
            const SHAPES = [
                null,
                [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], // I
                [[2, 0, 0], [2, 2, 2], [0, 0, 0]],                         // J
                [[0, 0, 3], [3, 3, 3], [0, 0, 0]],                         // L
                [[4, 4], [4, 4]],                                          // O
                [[0, 5, 5], [5, 5, 0], [0, 0, 0]],                         // S
                [[0, 6, 0], [6, 6, 6], [0, 0, 0]],                         // T
                [[7, 7, 0], [0, 7, 7], [0, 0, 0]]                          // Z
            ];
            
            // Create a random piece
            function createPiece() {
                const pieceIndex = Math.floor(Math.random() * 7) + 1;
                const pieceShape = SHAPES[pieceIndex];
                
                return {
                    position: {x: Math.floor(BOARD_WIDTH / 2) - Math.floor(pieceShape[0].length / 2), y: 0},
                    shape: pieceShape,
                    index: pieceIndex
                };
            }
            
            // Draw the board and current piece
            function draw() {
                // Clear the board
                const cells = document.querySelectorAll('.cell');
                cells.forEach(cell => {
                    cell.style.backgroundColor = '';
                });
                
                // Draw the locked pieces
                for (let row = 0; row < BOARD_HEIGHT; row++) {
                    for (let col = 0; col < BOARD_WIDTH; col++) {
                        if (board[row][col]) {
                            const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
                            cell.style.backgroundColor = COLORS[board[row][col]];
                        }
                    }
                }
                
                // Draw the current piece
                if (currentPiece) {
                    const shape = currentPiece.shape;
                    for (let row = 0; row < shape.length; row++) {
                        for (let col = 0; col < shape[row].length; col++) {
                            if (shape[row][col]) {
                                const x = currentPiece.position.x + col;
                                const y = currentPiece.position.y + row;
                                
                                if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
                                    const cell = document.querySelector(`.cell[data-row="${y}"][data-col="${x}"]`);
                                    cell.style.backgroundColor = COLORS[shape[row][col]];
                                }
                            }
                        }
                    }
                }
                
                // Update next piece display
                updateNextPieceDisplay();
            }
            
            // Update the next piece display
            function updateNextPieceDisplay() {
                nextPieceDisplay.innerHTML = '';
                
                if (nextPiece) {
                    const shape = nextPiece.shape;
                    
                    // Create cells for the next piece display
                    for (let row = 0; row < 4; row++) {
                        for (let col = 0; col < 4; col++) {
                            const cell = document.createElement('div');
                            cell.style.gridRow = row + 1;
                            cell.style.gridColumn = col + 1;
                            
                            if (row < shape.length && col < shape[row].length && shape[row][col]) {
                                cell.style.backgroundColor = COLORS[shape[row][col]];
                            } else {
                                cell.style.backgroundColor = 'transparent';
                            }
                            
                            nextPieceDisplay.appendChild(cell);
                        }
                    }
                }
            }
            
            // Check collision
            function collide() {
                const shape = currentPiece.shape;
                for (let row = 0; row < shape.length; row++) {
                    for (let col = 0; col < shape[row].length; col++) {
                        if (shape[row][col]) {
                            const x = currentPiece.position.x + col;
                            const y = currentPiece.position.y + row;
                            
                            if (
                                x < 0 || 
                                x >= BOARD_WIDTH || 
                                y >= BOARD_HEIGHT ||
                                (y >= 0 && board[y][x])
                            ) {
                                return true;
                            }
                        }
                    }
                }
                return false;
            }
            
            // Rotate the piece
            function rotatePiece() {
                const originalShape = currentPiece.shape;
                const rotated = [];
                
                // Transpose the matrix
                for (let i = 0; i < originalShape[0].length; i++) {
                    rotated.push([]);
                    for (let j = originalShape.length - 1; j >= 0; j--) {
                        rotated[i].push(originalShape[j][i]);
                    }
                }
                
                const originalPosition = {...currentPiece.position};
                currentPiece.shape = rotated;
                
                // Wall kick if needed
                if (collide()) {
                    currentPiece.position.x -= 1;
                    if (collide()) {
                        currentPiece.position.x += 2;
                        if (collide()) {
                            currentPiece.position.x -= 1;
                            currentPiece.shape = originalShape;
                        }
                    }
                }
            }
            
            // Merge the piece to the board
            function merge() {
                const shape = currentPiece.shape;
                for (let row = 0; row < shape.length; row++) {
                    for (let col = 0; col < shape[row].length; col++) {
                        if (shape[row][col]) {
                            const x = currentPiece.position.x + col;
                            const y = currentPiece.position.y + row;
                            
                            if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
                                board[y][x] = shape[row][col];
                            }
                        }
                    }
                }
            }
            
            // Clear completed lines and update score
            function clearLines() {
                let linesCleared = 0;
                
                for (let row = BOARD_HEIGHT - 1; row >= 0; row--) {
                    if (board[row].every(cell => cell !== 0)) {
                        // Remove the line
                        board.splice(row, 1);
                        // Add new empty line at the top
                        board.unshift(Array(BOARD_WIDTH).fill(0));
                        linesCleared++;
                        row++; // Check the same row again as we just moved everything down
                    }
                }
                
                if (linesCleared > 0) {
                    // Update score
                    const points = [0, 100, 300, 500, 800][linesCleared] * level;
                    score += points;
                    scoreDisplay.textContent = score;
                    
                    // Update level every 10 lines
                    const newLevel = Math.floor(score / 1000) + 1;
                    if (newLevel > level) {
                        level = newLevel;
                        levelDisplay.textContent = level;
                        dropInterval = Math.max(100, 1000 - (level - 1) * 50);
                    }
                }
            }
            
            // Reset the game state
            function resetGame() {
                board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
                score = 0;
                level = 1;
                dropInterval = 1000;
                isGameOver = false;
                isPaused = false;
                
                scoreDisplay.textContent = score;
                levelDisplay.textContent = level;
                
                gameOverDisplay.style.display = 'none';
                
                // Create initial pieces
                currentPiece = createPiece();
                nextPiece = createPiece();
                
                draw();
            }
            
            // Game over
            function gameOver() {
                isGameOver = true;
                cancelAnimationFrame(gameInterval);
                
                finalScoreDisplay.textContent = `Score: ${score}`;
                gameOverDisplay.style.display = 'block';
            }
            
            // Move the piece down
            function dropPiece() {
                currentPiece.position.y++;
                
                if (collide()) {
                    currentPiece.position.y--;
                    merge();
                    clearLines();
                    
                    // Get next piece
                    currentPiece = nextPiece;
                    nextPiece = createPiece();
                    
                    // Check if game over
                    if (collide()) {
                        gameOver();
                    }
                }
                
                dropCounter = 0;
                draw();
            }
            
            // Move the piece left or right
            function movePiece(direction) {
                currentPiece.position.x += direction;
                if (collide()) {
                    currentPiece.position.x -= direction;
                }
                draw();
            }
            
            // Hard drop (drop the piece immediately)
            function hardDrop() {
                while (!collide()) {
                    currentPiece.position.y++;
                }
                currentPiece.position.y--;
                dropPiece();
            }
            
            // Main game loop
            function update(time = 0) {
                if (isGameOver || isPaused) return;
                
                const deltaTime = time - lastTime;
                lastTime = time;
                
                dropCounter += deltaTime;
                if (dropCounter > dropInterval) {
                    dropPiece();
                }
                
                // Draw the game state
                draw();
                
                gameInterval = requestAnimationFrame(update);
            }
            
            // Keyboard controls
            document.addEventListener('keydown', event => {
                if (isGameOver) return;
                
                if (event.key === 'p') {
                    isPaused = !isPaused;
                    if (!isPaused && !isGameOver) {
                        update();
                    }
                    return;
                }
                
                if (isPaused) return;
                
                switch (event.key) {
                    case 'ArrowLeft':
                        movePiece(-1);
                        break;
                    case 'ArrowRight':
                        movePiece(1);
                        break;
                    case 'ArrowDown':
                        dropPiece();
                        break;
                    case 'ArrowUp':
                        rotatePiece();
                        draw();
                        break;
                    case ' ':
                        hardDrop();
                        break;
                }
            });
            
            // Button events
            startBtn.addEventListener('click', () => {
                resetGame();
                update();
                startBtn.textContent = 'Restart Game';
            });
            
            restartBtn.addEventListener('click', () => {
                resetGame();
                update();
            });
            
            // Initialize the game
            initializeBoard();
            resetGame();
        });
