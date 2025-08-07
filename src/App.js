import React, { useState } from 'react';
import Game from './Game';
import MainScreen from './MainScreen';
import './App.css';

function App() {
  const [gameMode, setGameMode] = useState(null); // null, '1v1', 'bot', 'rules'
  const [difficulty, setDifficulty] = useState('normal'); // easy, normal, hard
  const [playerNames, setPlayerNames] = useState({ p1: 'Player 1', p2: 'Player 2' });
  const [timeLimit, setTimeLimit] = useState(60);

  const handleModeSelect = (mode, names, selectedDifficulty = 'normal', selectedTimeLimit = 60) => {
    setGameMode(mode);
    setPlayerNames(names);
    setTimeLimit(selectedTimeLimit);
    if (mode === 'bot') {
      setDifficulty(selectedDifficulty);
    }
  };

  const handleBackToMain = () => {
    setGameMode(null);
  };

  return (
    <div className="App">
      {gameMode ? (
        <Game 
          gameMode={gameMode} 
          difficulty={difficulty} 
          playerNames={playerNames}
          timeLimit={timeLimit}
          onBackToMain={handleBackToMain} 
        />
      ) : (
        <MainScreen onModeSelect={handleModeSelect} />
      )}
    </div>
  );
}

export default App;