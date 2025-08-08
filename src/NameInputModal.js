
import React, { useState } from 'react';
import './NameInputModal.css';

function NameInputModal({ show, onClose, onSubmit, title }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name);
      setName('');
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="close-button">&times;</button>
        <h2>{title}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력하세요"
            autoFocus
          />
          <button type="submit">확인</button>
        </form>
      </div>
    </div>
  );
}

export default NameInputModal;
