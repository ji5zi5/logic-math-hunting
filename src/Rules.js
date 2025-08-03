
import React from 'react';
import './Rules.css';

const Rules = ({ onClose }) => {
  return (
    <div className="rules-modal-overlay" onClick={onClose}>
      <div className="rules-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>X</button>
        <h1 className="rules-title">수식 따먹기: 게임 규칙</h1>

        <div className="rule-section">
          <h2>게임 목표 🎯</h2>
          <p>6턴 동안 상대방보다 더 많은 숫자 칸을 차지하여 승리하세요!</p>
        </div>

        <div className="rule-section">
          <h2>게임 준비 🎲</h2>
          <ul>
            <li><strong>게임판:</strong> 13x13 크기의 판에 1~9 사이의 숫자가 무작위로 채워집니다.</li>
            <li><strong>시작 위치:</strong>
              <ul>
                <li><strong>선공 (Player 1):</strong> 좌측 상단 끝 칸</li>
                <li><strong>후공 (Player 2):</strong> 우측 하단 끝 칸</li>
              </ul>
            </li>
            <li><strong>공용 숫자 자원:</strong> 모든 플레이어는 <strong>{'{1, 2, 2, 3, 4, 4, 5, 6, 6}'}</strong> 숫자 풀을 함께 사용합니다.</li>
          </ul>
        </div>

        <div className="rule-section">
          <h2>게임 진행 (턴 방식) ⚔️</h2>
          <p>한 턴은 <strong>두 번의 도전</strong>으로 이루어집니다. 첫 번째 도전에 성공하더라도 두 번째 도전을 진행합니다.</p>
          <ol>
            <li>
              <strong>첫 번째 도전:</strong>
              <p>칸을 선택하고 목표 숫자를 선언한 뒤, 수식을 만들어 도전합니다. 성공 시 해당 칸을 차지합니다.</p>
            </li>
            <li>
              <strong>두 번째 도전:</strong>
              <p>첫 번째 도전의 성공 여부와 관계없이, 새로운 칸을 선택하여 다시 한번 도전합니다. 성공 시 해당 칸을 차지합니다.</p>
            </li>
          </ol>
          <p className="example">한 턴에 최대 두 번의 영토 확장이 가능합니다!</p>
        </div>

        <div className="rule-section">
          <h2>상세 규칙 및 제약사항 📜</h2>
          <ul>
            <li><strong>빈칸 (장애물):</strong> 빈칸을 포함하거나 뛰어넘어 숫자를 묶을 수 없습니다.</li>
            <li><strong>영토:</strong> 한 번 차지한 칸은 게임이 끝날 때까지 자신의 영토가 됩니다.</li>
            <li><strong>진행 불가:</strong> 더 이상 차지할 칸이 없으면 해당 턴은 자동으로 실패 처리됩니다.</li>
          </ul>
        </div>

        <div className="rule-section">
          <h2>게임 종료 및 승리 🏆</h2>
          <ul>
            <li><strong>종료 조건:</strong> 총 12턴 (각 플레이어 6턴)이 진행되거나, 판의 모든 숫자가 차지되면 게임이 종료됩니다.</li>
            <li><strong>승리 판정:</strong> 게임 종료 시 더 많은 칸을 차지한 플레이어가 승리합니다. 동점일 경우 무승부입니다.</li>
          </ul>
        </div>
        
        <div className="rule-section strategy-tip">
          <h3>전략 Tip! 💡</h3>
          <p>단순히 어려운 수식을 푸는 것보다, 상대의 길을 막거나 넓은 영토를 차지할 수 있는 전략적인 목표 숫자 선정이 승리의 열쇠입니다!</p>
        </div>

      </div>
    </div>
  );
};

export default Rules;
