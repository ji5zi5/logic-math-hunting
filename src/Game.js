import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { evaluate, factorial, sqrt } from 'mathjs';
import './Game.css';

// --- CORE GAME UTILITIES (COMPONENT-INDEPENDENT) ---
const fixedObstaclesUserCoords = [
  { x: 4, y: 4 }, { x: 5, y: 5 }, { x: 6, y: 6 }, { x: 7, y: 7 },
  { x: 8, y: 8 }, { x: 9, y: 9 }, { x: 10, y: 10 },
  { x: 4, y: 10 }, { x: 10, y: 4 }
];

const userToInternal = (userX, userY) => ({ row: 13 - userY, col: userX - 1 });
const isAdjacent = (c1, c2) => Math.abs(c1.row - c2.row) + Math.abs(c1.col - c2.col) === 1;
const isStraightLine = (cells) => cells.length <= 1 || cells.every(c => c.row === cells[0].row) || cells.every(c => c.col === cells[0].col);
const isUnclaimedAndNotObstacle = (r, c, board) => {
    return r >= 0 && r < 13 && c >= 0 && c < 13 && board[r]?.[c]?.owner === null && !board[r]?.[c]?.isObstacle;
};

const getCellsInPath = (start, end) => {
  const path = [];
  if (!start || !end) return path;
  if (start.row === end.row) {
    for (let c = Math.min(start.col, end.col); c <= Math.max(start.col, end.col); c++) path.push({ row: start.row, col: c });
  } else if (start.col === end.col) {
    for (let r = Math.min(start.row, end.row); r <= Math.max(start.row, end.row); r++) path.push({ row: r, col: start.col });
  }
  return path;
};

const findBestMove = (board, ownedCells, formulas, difficulty, isFirstPlayer) => {
  const adjacentCells = [];
  ownedCells.forEach(cell => {
    const neighbors = [
      { row: cell.row - 1, col: cell.col },
      { row: cell.row + 1, col: cell.col },
      { row: cell.row, col: cell.col - 1 },
      { row: cell.row, col: cell.col + 1 },
    ];
    neighbors.forEach(n => {
      if (isUnclaimedAndNotObstacle(n.row, n.col, board) && !adjacentCells.some(ac => ac.row === n.row && ac.col === n.col)) {
        adjacentCells.push(n);
      }
    });
  });

  if (ownedCells.length === 0) {
      const startCell = isFirstPlayer ? userToInternal(1, 13) : userToInternal(13, 1);
      if (isUnclaimedAndNotObstacle(startCell.row, startCell.col, board)) {
          adjacentCells.push(startCell);
      }
  }

  let possibleMoves = [];

  adjacentCells.forEach(startCell => {
    const directions = [
      { r: -1, c: 0 }, // Up
      { r: 1, c: 0 },  // Down
      { r: 0, c: -1 }, // Left
      { r: 0, c: 1 }   // Right
    ];

    directions.forEach(dir => {
      for (let length = 2; length <= 6; length++) {
        let currentPath = [];
        let isValidPath = true;
        for (let i = 0; i < length; i++) {
          const nextRow = startCell.row + i * dir.r;
          const nextCol = startCell.col + i * dir.c;
          if (isUnclaimedAndNotObstacle(nextRow, nextCol, board)) {
            currentPath.push({ row: nextRow, col: nextCol });
          } else {
            isValidPath = false;
            break;
          }
        }

        if (isValidPath && currentPath.length > 1) {          const sortedPath = [...currentPath].sort((a, b) => {              if (a.row !== b.row) return a.row - b.row;              return a.col - b.col;          });          const targetStr = sortedPath.map(cell => board[cell.row][cell.col].value).join('');          if (formulas[targetStr]) {            let eq = formulas[targetStr].replace(/factorial\(([^)]+)\)/g, '($1)!');            possibleMoves.push({              path: currentPath,              target: parseInt(targetStr, 10),              equation: eq            });          }        }
      }
    });
  });

  if (possibleMoves.length === 0) return null;

  const difficultySettings = {
    easy: { lengths: [2, 3], probs: [0.7, 0.3] },
    normal: { lengths: [3, 4], probs: [0.6, 0.4] },
    hard: { lengths: [4, 5, 6], probs: [0.2, 0.5, 0.3] }
  };

  const settings = difficultySettings[difficulty];
  let movesByLength = {};
  settings.lengths.forEach(len => { movesByLength[len] = []; });

  possibleMoves.forEach(move => {
    const len = move.path.length;
    if (settings.lengths.includes(len)) {
      movesByLength[len].push(move);
    }
  });

  const availableLengths = settings.lengths.filter(len => movesByLength[len].length > 0);
  if (availableLengths.length === 0) return null;

  const availableProbs = settings.probs.filter((_, i) => availableLengths.includes(settings.lengths[i]));
  const totalProb = availableProbs.reduce((a, b) => a + b, 0);
  const normalizedProbs = availableProbs.map(p => p / totalProb);

  const random = Math.random();
  let cumulativeProb = 0;
  let chosenLength = availableLengths[availableLengths.length - 1];

  for (let i = 0; i < availableLengths.length; i++) {
    cumulativeProb += normalizedProbs[i];
    if (random < cumulativeProb) {
      chosenLength = availableLengths[i];
      break;
    }
  }

  const finalMoves = movesByLength[chosenLength];
  return finalMoves[Math.floor(Math.random() * finalMoves.length)];
};

const Game = ({ gameMode, difficulty = 'normal', playerNames, timeLimit, onBackToMain }) => {
  const [board, setBoard] = useState([]);
  const [playerTurn, setPlayerTurn] = useState(null);
  const [firstPlayer, setFirstPlayer] = useState(null);
  const [turnCount, setTurnCount] = useState(0);
  const [numberPool] = useState([1, 3, 5, 2, 2, 4, 4, 6, 6]);
  const [player1ClaimedCells, setPlayer1ClaimedCells] = useState([]);
  const [player2ClaimedCells, setPlayer2ClaimedCells] = useState([]);
  const [challengeCount, setChallengeCount] = useState(1);
  const [selectedCells, setSelectedCells] = useState([]);
  const [targetNumber, setTargetNumber] = useState(null);
  const [equation, setEquation] = useState('');
  const [gamePhase, setGamePhase] = useState('selecting'); // selecting, equation, over
  const [message, setMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartCell, setDragStartCell] = useState(null);
  const [hoveredCells, setHoveredCells] = useState([]);
  const [timer, setTimer] = useState(timeLimit);
  const [botThinking, setBotThinking] = useState(false);
  const [formulas, setFormulas] = useState(null);
  
  const [bgmVolume, setBgmVolume] = useState(0.5);
  const [sfxVolume, setSfxVolume] = useState(0.5);

  const bgmRef = useRef(null);
  const sfxRef = useRef(null);
  const bgmSliderRef = useRef(null);
  const sfxSliderRef = useRef(null);

  const endTurn = useCallback(() => {
    const p1Score = player1ClaimedCells.length;
    const p2Score = player2ClaimedCells.length;
    const isTurnLimitReached = turnCount + 1 >= 12;
    const isBoardFull = board.length > 0 && board.every(row => row.every(cell => cell.isObstacle || cell.owner));

    if (isTurnLimitReached || isBoardFull) {
        const reason = isTurnLimitReached ? '턴 제한 도달' : '보드 가득 참';
        let winnerMessage;
        if (p1Score > p2Score) winnerMessage = `${playerNames.p1} 승리!`;
        else if (p2Score > p1Score) winnerMessage = `${playerNames.p2} 승리!`;
        else winnerMessage = '무승부!';
        
        setMessage(`게임 종료! ${reason}. ${playerNames.p1}: ${p1Score}칸, ${playerNames.p2}: ${p2Score}칸. ${winnerMessage}`)
        setGamePhase('over');
        return;
    }

    const nextPlayer = playerTurn === 'player1' ? 'player2' : 'player1';
    setPlayerTurn(nextPlayer);
    setChallengeCount(1);
    setGamePhase('selecting');
    setTimer(timeLimit);
    setTurnCount(prev => prev + 1);
  }, [playerTurn, turnCount, board, player1ClaimedCells, player2ClaimedCells, playerNames]);

  const handleChallengeEnd = useCallback((success) => {
    setEquation('');
    setSelectedCells([]);
    setTargetNumber(null);

    if (challengeCount === 1) {
        setChallengeCount(2);
        setGamePhase('selecting');
        setTimer(timeLimit);
    } else {
        endTurn();
    }
  }, [challengeCount, endTurn]);

  const handleSubmitEquation = useCallback(() => {
    let isCorrect = false;
    const numsInEq = (equation.match(/\d+/g) || []).map(Number);
    let tempPool = [...numberPool];
    const allNumsAvail = numsInEq.every(num => {
      const index = tempPool.indexOf(num);
      if (index > -1) { tempPool.splice(index, 1); return true; }
      return false;
    });

    if (!allNumsAvail) {
        setMessage('사용할 수 없는 숫자가 포함되어 있습니다.');
    } else {
      try {
        if (Math.abs(evaluate(equation, { factorial, sqrt }) - targetNumber) < 1e-9) isCorrect = true;
        else setMessage(`수식 결과가 목표와 다릅니다.`);
      } catch (e) { setMessage(`잘못된 수식입니다: ${e.message}`); }
    }

    if (isCorrect) {
        if (sfxRef.current) {
            sfxRef.current.currentTime = 0;
            sfxRef.current.play().catch(e => console.log("SFX play failed: ", e));
        }
        setBoard(prevBoard => {
            const newBoard = prevBoard.map(r => r.map(c => ({ ...c })));
            selectedCells.forEach(c => newBoard[c.row][c.col].owner = playerTurn);
            return newBoard;
        });
        if (playerTurn === 'player1') {
            setPlayer1ClaimedCells(prev => [...prev, ...selectedCells]);
        } else {
            setPlayer2ClaimedCells(prev => [...prev, ...selectedCells]);
        }
    }
    handleChallengeEnd(isCorrect);
  }, [equation, numberPool, targetNumber, selectedCells, playerTurn, handleChallengeEnd]);

  const handleTimeout = useCallback(() => {
    setMessage('시간 초과! 다음 도전으로 넘어갑니다.');
    handleChallengeEnd(false);
  }, [handleChallengeEnd]);

  const resetGame = useCallback(() => {
    const fixedObstacles = fixedObstaclesUserCoords.map(c => userToInternal(c.x, c.y));
    const newBoard = Array(13).fill(null).map((_, r) =>
      Array(13).fill(null).map((_, c) => ({
        value: fixedObstacles.some(obs => obs.row === r && obs.col === c) ? null : Math.floor(Math.random() * 9) + 1,
        isObstacle: fixedObstacles.some(obs => obs.row === r && obs.col === c),
        owner: null
      }))
    );
    setBoard(newBoard);

    const p1Starts = Math.random() < 0.5;
    const first = p1Starts ? 'player1' : 'player2';
    setFirstPlayer(first);
    setPlayerTurn(first);
    setTurnCount(0);
    setPlayer1ClaimedCells([]);
    setPlayer2ClaimedCells([]);
    setChallengeCount(1);
    setSelectedCells([]);
    setTargetNumber(null);
    setEquation('');
    setGamePhase('selecting');
    setTimer(timeLimit);
  }, []);

  const handleMouseDown = useCallback((row, col) => {
    if (gamePhase !== 'selecting' || (gameMode === 'bot' && playerTurn === 'player2')) return;

    const playerOwnedCells = playerTurn === 'player1' ? player1ClaimedCells : player2ClaimedCells;

    if (playerOwnedCells.length === 0) {
        const isCurrentPlayerFirst = playerTurn === firstPlayer;
        const startCell = isCurrentPlayerFirst ? userToInternal(1, 13) : userToInternal(13, 1);

        if (row !== startCell.row || col !== startCell.col) {
            setMessage(`첫 턴입니다. ${isCurrentPlayerFirst ? '좌측 상단' : '우측 하단'}의 시작 위치를 선택하세요.`);
            return;
        }
    } else {
        const isAdjacentToTerritory = playerOwnedCells.some(c => isAdjacent(c, { row, col }));
        if (!isAdjacentToTerritory) {
            setMessage('자신의 영토에 인접한 빈 칸만 선택할 수 있습니다.');
            return;
        }
    }

    if (isUnclaimedAndNotObstacle(row, col, board)) {
        setIsDragging(true);
        setDragStartCell({ row, col });
        setHoveredCells([{ row, col }]);
    } else {
        setMessage('선택할 수 없는 칸입니다.');
    }
  }, [gamePhase, playerTurn, player1ClaimedCells, player2ClaimedCells, firstPlayer, board, gameMode]);

  const handleMouseEnter = useCallback((row, col) => {
    if (!isDragging) return;
    const pathCells = getCellsInPath(dragStartCell, { row, col });
    if (isStraightLine(pathCells) && pathCells.every(c => isUnclaimedAndNotObstacle(c.row, c.col, board))) {
      setHoveredCells(pathCells);
    }
  }, [isDragging, dragStartCell, board]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && hoveredCells.length > 0) {
      const targetStr = hoveredCells.map(cell => board[cell.row][cell.col].value).join('');
      const finalTarget = parseInt(targetStr, 10);
      if (!isNaN(finalTarget)) {
        setTargetNumber(finalTarget);
        setSelectedCells(hoveredCells);
        setEquation(''); // Clear equation before entering phase
        setGamePhase('equation');
        setTimer(timeLimit);
      }
    }
    setIsDragging(false);
    setDragStartCell(null);
    setHoveredCells([]);
  }, [isDragging, hoveredCells, board]);

  useEffect(() => {
    resetGame();
  }, [gameMode, resetGame]);

  useEffect(() => {
    if (gameMode === 'bot') {
      fetch(process.env.PUBLIC_URL + '/number_formulas_final.json')
        .then(response => response.json())
        .then(data => {
            const formulaMap = {};
            for (const result of data.results) {
                formulaMap[result.number] = result.formula;
            }
            setFormulas(formulaMap);
        })
        .catch(error => console.error('Error loading formulas:', error));
    }
  }, [gameMode]);

  useEffect(() => {
    if (gamePhase !== 'over') {
        const turnPlayerName = playerNames[playerTurn === 'player1' ? 'p1' : 'p2'];
        let phaseMessage;
        if (gameMode === 'bot' && playerTurn === 'player2' && gamePhase === 'equation') {
            phaseMessage = `${targetNumber} = ${equation}`;
        } else {
            phaseMessage = gamePhase === 'selecting' 
                ? `도전 ${challengeCount}: 칸을 선택하세요.`
                : `목표 ${targetNumber}: 수식을 입력하세요.`;
        }
        setMessage(`${turnPlayerName}, ${phaseMessage}`);
    }
  }, [playerTurn, gamePhase, playerNames, targetNumber, challengeCount, equation, gameMode]);
  
  useEffect(() => {
    if (gameMode === 'bot' && playerTurn === 'player2' && !botThinking && gamePhase === 'selecting' && formulas) {
      setBotThinking(true);
      setMessage('봇이 생각 중입니다...');
      setTimeout(() => {
        const ownedCells = player2ClaimedCells;
        const isBotFirst = firstPlayer === 'player2';
        const bestMove = findBestMove(board, ownedCells, formulas, difficulty, isBotFirst);

        if (bestMove) {
          setSelectedCells(bestMove.path);
          setTargetNumber(bestMove.target);
          setEquation(bestMove.equation);
          setGamePhase('equation');
        } else {
          setMessage('봇이 할 수 있는 행동이 없어 도전을 포기합니다.');
          handleChallengeEnd(false); 
        }
        setBotThinking(false);
      }, 2000);
    }
  }, [playerTurn, gameMode, botThinking, gamePhase, formulas, board, player2ClaimedCells, difficulty, firstPlayer, handleChallengeEnd]);

  useEffect(() => {
    if (gameMode === 'bot' && playerTurn === 'player2' && gamePhase === 'equation') {
      setTimeout(() => {
        handleSubmitEquation();
      }, 2500);
    }
  }, [gameMode, playerTurn, gamePhase, handleSubmitEquation]);

  useEffect(() => {
    let interval;
    if (timeLimit !== -1 && (gamePhase === 'selecting' || gamePhase === 'equation') && timer > 0) {
      interval = setInterval(() => {
        setTimer(t => t - 1);
      }, 1000);
    } else if (timeLimit !== -1 && timer <= 0) {
      handleTimeout();
    }
    return () => clearInterval(interval);
  }, [timer, gamePhase, handleTimeout, timeLimit]);

  // --- Audio Effects ---
  useEffect(() => {
    bgmRef.current = new Audio(process.env.PUBLIC_URL + '/sounds/bgm.mp3');
    bgmRef.current.loop = true;
    bgmRef.current.volume = bgmVolume;
    bgmRef.current.play().catch(e => console.log("BGM play failed: ", e));
    sfxRef.current = new Audio(process.env.PUBLIC_URL + '/sounds/adsf.mp3');

    return () => {
        if (bgmRef.current) {
            bgmRef.current.pause();
            bgmRef.current = null;
        }
    };
  }, []);

  

  useEffect(() => {
    if(bgmRef.current) {
        bgmRef.current.volume = bgmVolume;
        if (bgmVolume === "0") {
            bgmRef.current.pause();
        } else {
            bgmRef.current.play().catch(e => console.log("BGM play failed: ", e));
        }
    }
  }, [bgmVolume]);

  useEffect(() => {
    if(sfxRef.current) sfxRef.current.volume = sfxVolume;
  }, [sfxVolume]);

  return (
    <div className="game-container" onMouseUp={handleMouseUp}>
        <div className="game-info-panel">
            <p>현재 턴: <span className={playerTurn === 'player1' ? 'player1-text' : 'player2-text'}>{playerNames[playerTurn === 'player1' ? 'p1' : 'p2']}</span></p>
            <p>{playerNames.p1}: {player1ClaimedCells.length}칸 / {playerNames.p2}: {player2ClaimedCells.length}칸</p>
            <p>턴: {turnCount + 1} / 12</p>
            <div className="timer">남은 시간: {timeLimit === -1 ? '무제한' : `${timer}초`}</div>
            <p className="message">{message}</p>
            <button onClick={onBackToMain} className="back-to-main-button">메인으로</button>
            <button onClick={resetGame} className="reset-button">게임 초기화</button>
        </div>
        <div className="game-main-content">
            <div className="audio-controls">
                <div className="audio-control-group">
                    <label htmlFor="bgm-checkbox">BGM</label>
                    <input 
                        ref={bgmSliderRef}
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.1" 
                        value={bgmVolume} 
                        onChange={(e) => {
                            setBgmVolume(e.target.value);
                            if (bgmSliderRef.current) {
                                bgmSliderRef.current.style.setProperty('--fill-percent', `${e.target.value * 100}%`);
                            }
                        }}
                    />
                </div>
                <div className="audio-control-group">
                    <label>효과음</label>
                    <input 
                        ref={sfxSliderRef}
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.1" 
                        value={sfxVolume} 
                        onChange={(e) => {
                            setSfxVolume(e.target.value);
                            if (sfxSliderRef.current) {
                                sfxSliderRef.current.style.setProperty('--fill-percent', `${e.target.value * 100}%`);
                            }
                        }} 
                    />
                </div>
            </div>
            <div className="game-board" onMouseLeave={handleMouseUp}>
                {board.map((row, rIdx) => row.map((cell, cIdx) => {
                    const isSelected = selectedCells.some(c => c.row === rIdx && c.col === cIdx);
                    const isHovered = hoveredCells.some(c => c.row === rIdx && c.col === cIdx);
                    let cellClass = 'board-cell';
                    if (cell.isObstacle) cellClass += ' obstacle';
                    else if (cell.owner) cellClass += cell.owner === firstPlayer ? ' player1-owned' : ' player2-owned';
                    if (isSelected) cellClass += ' selected-target-cell';
                    if (isHovered) cellClass += ' hovered-cell';
                    return (
                        <div key={`${rIdx}-${cIdx}`} className={cellClass} onMouseDown={() => handleMouseDown(rIdx, cIdx)} onMouseEnter={() => handleMouseEnter(rIdx, cIdx)}>
                            {cell.value}
                        </div>
                    );
                }))}
            </div>
            {gamePhase === 'equation' && !(gameMode === 'bot' && playerTurn === 'player2') && (
                <EquationEditor 
                    equation={equation} 
                    onEquationChange={setEquation} 
                    onSubmit={handleSubmitEquation} 
                    targetNumber={targetNumber} 
                    numberPool={numberPool}
                    isBotTurn={gameMode === 'bot' && playerTurn === 'player2'}
                />
            )}
            {gamePhase === 'over' && (
                <div className="game-over-screen">
                    <h2>게임 종료!</h2>
                    <p>{message}</p>
                    <button onClick={resetGame}>다시 시작</button>
                </div>
            )}
        </div>
    </div>
  );
};

const EquationEditor = ({ equation, onEquationChange, onSubmit, targetNumber, numberPool, isBotTurn }) => {
    const [lastInputWasNumber, setLastInputWasNumber] = useState(false);
    const [parenthesisBalance, setParenthesisBalance] = useState(0);

    const remainingPool = useMemo(() => {
        const numsInEq = (equation.match(/\d+/g) || []).map(Number);
        const tempPool = [...numberPool];
        numsInEq.forEach(num => {
            const index = tempPool.indexOf(num);
            if (index > -1) tempPool.splice(index, 1);
        });
        return tempPool;
    }, [equation, numberPool]);

    const handleButtonClick = useCallback((value) => {
        if (isBotTurn) return;
        let newEquation = equation;
        if (typeof value === 'number') {
            if (!lastInputWasNumber) {
                const countInEq = (equation.match(new RegExp(value, "g")) || []).length;
                const countInPool = numberPool.filter(n => n === value).length;
                if (countInEq < countInPool) {
                    newEquation += value;
                    setLastInputWasNumber(true);
                }
            }
        } else if (['+', '-', '*', '/', '^'].includes(value)) {
            if (lastInputWasNumber) {
                newEquation += value;
                setLastInputWasNumber(false);
            }
        } else if (value === '!') {
            if (lastInputWasNumber) {
                newEquation += value;
                setLastInputWasNumber(true);
            }
        } else if (value === '(' || value === 'sqrt(') {
            if (!lastInputWasNumber) {
                newEquation += value;
                setParenthesisBalance(p => p + 1);
            }
        } else if (value === ')') {
            if (lastInputWasNumber && parenthesisBalance > 0) {
                newEquation += value;
                setParenthesisBalance(p => p - 1);
                setLastInputWasNumber(true);
            }
        }
        onEquationChange(newEquation);
    }, [equation, onEquationChange, lastInputWasNumber, numberPool, parenthesisBalance, isBotTurn]);

    const backspace = useCallback(() => {
        if (isBotTurn || equation.length === 0) return;
        let newEquation = equation;
        if (newEquation.endsWith('sqrt(')) {
            newEquation = newEquation.slice(0, -5);
            setParenthesisBalance(p => p - 1);
        } else {
            const lastChar = equation.slice(-1);
            if (lastChar === '(') setParenthesisBalance(p => p - 1);
            if (lastChar === ')') setParenthesisBalance(p => p + 1);
            newEquation = equation.slice(0, -1);
        }
        onEquationChange(newEquation);
        if (newEquation.length > 0) {
            const newLastChar = newEquation.slice(-1);
            setLastInputWasNumber(!isNaN(parseInt(newLastChar, 10)) || newLastChar === '!' || newLastChar === ')');
        } else {
            setLastInputWasNumber(false);
        }
    }, [equation, onEquationChange, isBotTurn]);

    const clear = useCallback(() => {
        if (isBotTurn) return;
        onEquationChange('');
        setLastInputWasNumber(false);
        setParenthesisBalance(0);
    }, [onEquationChange, isBotTurn]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isBotTurn) return;
            e.preventDefault();
            if (e.key >= '0' && e.key <= '9') handleButtonClick(parseInt(e.key, 10));
            else if (['+', '-', '*', '/', '^', '(', ')', '!'].includes(e.key)) handleButtonClick(e.key);
            else if (e.key === 'Enter') onSubmit();
            else if (e.key === 'Backspace') backspace();
            else if (e.key.toLowerCase() === 'c') clear();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleButtonClick, onSubmit, backspace, clear, isBotTurn]);

    return (
        <div className="equation-input">
            <div className="equation-display">
                {equation || '수식을 입력하세요'}
                <div className="target-number-display">목표: {targetNumber}</div>
            </div>
            <div className="calculator-buttons">
                {numberPool.filter((value, index, self) => self.indexOf(value) === index).sort((a, b) => a - b).map(num => {
                    const isAvailable = remainingPool.includes(num);
                    return <button key={num} onClick={() => handleButtonClick(num)} disabled={isBotTurn || !isAvailable || lastInputWasNumber}>{num}</button>;
                })}
                <button onClick={() => handleButtonClick('+')} disabled={isBotTurn || !lastInputWasNumber}>+</button>
                <button onClick={() => handleButtonClick('-')} disabled={isBotTurn || !lastInputWasNumber}>-</button>
                <button onClick={() => handleButtonClick('*')} disabled={isBotTurn || !lastInputWasNumber}>*</button>
                <button onClick={() => handleButtonClick('/')} disabled={isBotTurn || !lastInputWasNumber}>/</button>
                <button onClick={() => handleButtonClick('^')} disabled={isBotTurn || !lastInputWasNumber}>^</button>
                <button onClick={() => handleButtonClick('!')} disabled={isBotTurn || !lastInputWasNumber}>!</button>
                <button onClick={() => handleButtonClick('sqrt(')} disabled={isBotTurn || lastInputWasNumber}>sqrt</button>
                <button onClick={() => handleButtonClick('(')} disabled={isBotTurn || lastInputWasNumber}>(</button>
                <button onClick={() => handleButtonClick(')')} disabled={isBotTurn || !lastInputWasNumber || parenthesisBalance <= 0}>)</button>
                <button onClick={clear} className="clear-button" disabled={isBotTurn}>C</button>
                <button onClick={backspace} className="backspace-button" disabled={isBotTurn}>←</button>
                <button onClick={onSubmit} className="submit-button" disabled={isBotTurn}>제출</button>
            </div>
            <p>남은 숫자: {remainingPool.join(', ')}</p>
        </div>
    );
};

export default Game;
