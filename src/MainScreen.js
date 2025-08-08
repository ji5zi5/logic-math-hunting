
import React, { useState } from 'react';
import './MainScreen.css';
import Rules from './Rules';
import NameInputModal from './NameInputModal'; // 모달 컴포넌트 import

const MainScreen = ({ onModeSelect }) => {
  const [showRules, setShowRules] = useState(false);
  const [showDifficultySelection, setShowDifficultySelection] = useState(false);
  const [timeLimit, setTimeLimit] = useState(60);

  // 모달 상태 관리
  const [modalState, setModalState] = useState({ show: false, title: '', mode: null, difficulty: null, player1Name: null });

  const handleStartGame = (mode, difficulty = 'normal') => {
    // 1단계: 플레이어 1의 이름 입력을 위해 모달 열기
    setModalState({ show: true, title: '플레이어 1의 이름을 입력하세요', mode, difficulty });
  };

  const handleNameSubmit = (name) => {
    const { mode, difficulty, player1Name } = modalState;

    if (!player1Name) {
      // 2단계: 플레이어 1의 이름이 입력됨
      if (mode === '1v1') {
        // 1v1 모드이면 플레이어 2의 이름 입력을 위해 다시 모달 열기
        setModalState({ ...modalState, title: '플레이어 2의 이름을 입력하세요', player1Name: name });
      } else {
        // 봇전 모드이면 바로 게임 시작
        onModeSelect(mode, { p1: name, p2: '봇' }, difficulty, timeLimit);
        setModalState({ show: false }); // 모달 닫기
      }
    } else {
      // 3단계: 플레이어 2의 이름이 입력됨 (1v1 모드)
      onModeSelect(mode, { p1: player1Name, p2: name }, difficulty, timeLimit);
      setModalState({ show: false }); // 모달 닫기
    }
  };

  const handleModalClose = () => {
    setModalState({ show: false }); // 모달 닫기
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

      {/* 이름 입력 모달 */}
      <NameInputModal
        show={modalState.show}
        title={modalState.title}
        onSubmit={handleNameSubmit}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default MainScreen;
