import React, { useState } from 'react';
import './MainScreen.css';
import Rules from './Rules';

const MainScreen = ({ onModeSelect }) => {
  const [showRules, setShowRules] = useState(false);
  const [showDifficultySelection, setShowDifficultySelection] = useState(false);
  const [timeLimit, setTimeLimit] = useState(60); // Default 60 seconds

  const handleStartGame = (mode, difficulty = 'normal') => {
    const player1Name = prompt("플레이어 1의 이름을 입력하세요:");
    const p1 = player1Name ? player1Name.trim() : 'Player 1';

    let p2;
    if (mode === '1v1') {
      const player2Name = prompt("플레이어 2의 이름을 입력하세요:");
      p2 = player2Name ? player2Name.trim() : 'Player 2';
    } else {
      p2 = '봇';
    }

    onModeSelect(mode, { p1, p2 }, difficulty, timeLimit);
  };

  return (
    <div className="main-screen-container">
      <h1 className="main-title">수식 따먹기</h1>
      
      <div className="game-settings">
        <label htmlFor="time-limit-select">시간 제한: </label>
        <select 
          id="time-limit-select"
          value={timeLimit}
          onChange={(e) => setTimeLimit(parseInt(e.target.value, 10))}
          className="time-limit-select"
        >
          <option value={-1}>무제한</option>
          <option value={30}>30초</option>
          <option value={60}>60초</option>
          <option value={90}>90초</option>
        </select>
      </div>

      {!showDifficultySelection ? (
        <div className="mode-selection-buttons">
          <button onClick={() => handleStartGame('1v1')} className="mode-button">1 vs 1</button>
          <button onClick={() => setShowDifficultySelection(true)} className="mode-button">봇전</button>
        </div>
      ) : (
        <div className="difficulty-selection-buttons">
          <button onClick={() => handleStartGame('bot', 'easy')} className="mode-button">쉬움</button>
          <button onClick={() => handleStartGame('bot', 'normal')} className="mode-button">보통</button>
          <button onClick={() => handleStartGame('bot', 'hard')} className="mode-button">어려움</button>
          <button onClick={() => setShowDifficultySelection(false)} className="back-button">뒤로</button>
        </div>
      )}

      <button onClick={() => setShowRules(true)} className="rules-button">규칙 보기</button>
      {showRules && <Rules onClose={() => setShowRules(false)} />}
    </div>
  );
};

export default MainScreen;