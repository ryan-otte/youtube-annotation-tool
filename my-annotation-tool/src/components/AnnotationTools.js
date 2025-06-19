import React, { useState } from 'react';
import './AnnotationTools.css';

const AnnotationTools = ({ onSelectTool, onChangeColor }) => {
  const [selectedTool, setSelectedTool] = useState('rectangle');
  const [selectedColor, setSelectedColor] = useState('#000000'); // Default color: black

  // Handle tool selection
  const handleToolSelect = (tool) => {
    setSelectedTool(tool);
    if (onSelectTool) {
      onSelectTool(tool); // Notify the parent component
    }
  };

  // Handle color change
  const handleColorChange = (e) => {
    const color = e.target.value;
    setSelectedColor(color);
    if (onChangeColor) {
      onChangeColor(color); // Notify the parent component
    }
  };

  return (
    <div className="annotation-tools">
      <h3>Annotation Tools</h3>
      <div className="tools">
        <button
          className={selectedTool === 'rectangle' ? 'active' : ''}
          onClick={() => handleToolSelect('rectangle')}
        >
          Rectangle
        </button>
        <button
          className={selectedTool === 'circle' ? 'active' : ''}
          onClick={() => handleToolSelect('circle')}
        >
          Circle
        </button>
        <button
          className={selectedTool === 'freehand' ? 'active' : ''}
          onClick={() => handleToolSelect('freehand')}
        >
          Freehand
        </button>
        <button
          className={selectedTool === 'text' ? 'active' : ''}
          onClick={() => handleToolSelect('text')}
        >
          Text
        </button>
      </div>
      <div className="color-picker">
        <label htmlFor="color">Color:</label>
        <input
          type="color"
          id="color"
          value={selectedColor}
          onChange={handleColorChange}
        />
      </div>
    </div>
  );
};

export default AnnotationTools;
