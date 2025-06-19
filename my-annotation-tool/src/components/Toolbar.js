import React from 'react';
//import './Toolbar.css';

const Toolbar = ({ selectedTool, setSelectedTool, handleUndo, handleRedo }) => {
  return (
    <div className="toolbar">
      <button
        className={selectedTool === 'rectangle' ? 'active' : ''}
        onClick={() => setSelectedTool('rectangle')}
      >
        Draw Rectangle
      </button>
      <button
        className={selectedTool === 'circle' ? 'active' : ''}
        onClick={() => setSelectedTool('circle')}
      >
        Draw Circle
      </button>
      <button onClick={handleUndo}>Undo</button>
      <button onClick={handleRedo}>Redo</button>
    </div>
  );
};

export default Toolbar;
