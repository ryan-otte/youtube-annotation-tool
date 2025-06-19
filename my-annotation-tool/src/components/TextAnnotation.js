import React, { useState } from 'react';

const TextAnnotation = () => {
  const [annotations, setAnnotations] = useState([]);
  const [newAnnotation, setNewAnnotation] = useState('');

  const handleAddAnnotation = () => {
    if (newAnnotation.trim()) {
      setAnnotations([
        ...annotations,
        { text: newAnnotation, timestamp: new Date().toLocaleTimeString() }
      ]);
      setNewAnnotation('');
    }
  };

  return (
    <div>
      <textarea
        placeholder="Add your annotation here..."
        value={newAnnotation}
        onChange={(e) => setNewAnnotation(e.target.value)}
      ></textarea>
      <button onClick={handleAddAnnotation}>Add Annotation</button>
      <div>
        <h3>Annotations:</h3>
        <ul>
          {annotations.map((annotation, index) => (
            <li key={index}>
              <strong>{annotation.timestamp}:</strong> {annotation.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TextAnnotation;
