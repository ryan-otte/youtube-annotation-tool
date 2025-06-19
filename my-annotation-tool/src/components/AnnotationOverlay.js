import React, { useState, useRef, useEffect } from 'react';
import './AnnotationOverlay.css';

const AnnotationOverlay = ({ selectedTool, annotations, setAnnotations, onSelectAnnotation, onEraseAnnotation, annotationColor = 'red', playerRef }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const overlayRef = useRef(null);
  const svgRef = useRef(null);
  const textInputRef = useRef(null);
  const [lastMove, setLastMove] = useState(Date.now());

  // Debug logs to verify props
  useEffect(() => {
    console.log("AnnotationOverlay received props:", { 
      selectedTool, 
      annotationsCount: annotations?.length,
      canDraw: !!selectedTool && !!setAnnotations,
      color: annotationColor
    });
    
    // Debug annotation contents on mount or when annotations change
    if (Array.isArray(annotations)) {
      const pencilAnnotations = annotations.filter(a => a.type === 'pencil');
      const textAnnotations = annotations.filter(a => a.type === 'text');
      
      console.log("Pencil annotations:", pencilAnnotations.length, 
        pencilAnnotations.map(a => ({
          id: a.id, 
          hasPoints: !!a.points, 
          pointsLength: a.points?.length || 0,
          samplePoints: a.points?.slice(0, 2) || []
        }))
      );
      
      console.log("Text annotations:", textAnnotations.length, 
        textAnnotations.map(a => ({
          id: a.id, 
          text: a.text, 
          position: `(${a.x}, ${a.y})`
        }))
      );
    }
  }, [selectedTool, annotations, setAnnotations, annotationColor]);

  // Focus text input when it appears
  useEffect(() => {
    if (showTextInput && textInputRef.current) {
      console.log("Focusing text input");
      textInputRef.current.focus();
    }
  }, [showTextInput]);

  // Create an SVG points string from array of points
  const createPointsString = (points) => {
    if (!points || points.length === 0) return "";
    
    // Ensure points are properly formatted as numbers
    return points.map(p => {
      const x = typeof p.x === 'number' ? p.x : parseFloat(p.x || 0);
      const y = typeof p.y === 'number' ? p.y : parseFloat(p.y || 0);
      return `${x},${y}`;
    }).join(' ');
  };

  const handleMouseDown = (e) => {
    if (!selectedTool || !overlayRef.current) return;
    
    // If text input is visible, don't process other mouse events
    if (showTextInput) return;
    
    console.log("Mouse down on overlay, selectedTool:", selectedTool);
    
    const overlayRect = overlayRef.current.getBoundingClientRect();
    const xStart = ((e.clientX - overlayRect.left) / overlayRect.width) * 100;
    const yStart = ((e.clientY - overlayRect.top) / overlayRect.height) * 100;
    
    // Get current video time if player exists
    const currentTime = playerRef?.current ? Math.floor(playerRef.current.getCurrentTime()) : 0;
    
    // Handle text tool
    if (selectedTool === 'text') {
      console.log("Text tool selected, showing input at", xStart, yStart);
      setTextPosition({ x: xStart, y: yStart });
      setTextInput('');
      setShowTextInput(true);
      return; // Don't create annotation yet - we'll do that after text is entered
    }
    
    // Handle eraser tool
    if (selectedTool === 'eraser') {
      // Find annotations near this point and remove them
      if (annotations && annotations.length > 0) {
        const clickRadius = 5; // % of video width/height
        let removedAnnotation = null;
        
        // First, check if we're clicking directly on an annotation
        for (const anno of annotations) {
          if (anno.type === 'rectangle' || anno.type === 'circle') {
            // Check if click is within bounds
            if (xStart >= anno.x && 
                xStart <= anno.x + Math.abs(anno.width) && 
                yStart >= anno.y && 
                yStart <= anno.y + Math.abs(anno.height)) {
              removedAnnotation = anno;
              break;
            }
          } else if (anno.type === 'text') {
            // For text, use a radius check around center
            const distance = Math.sqrt(Math.pow(anno.x - xStart, 2) + Math.pow(anno.y - yStart, 2));
            if (distance <= 5) { // 5% radius for text
              removedAnnotation = anno;
              break;
            }
          } else if (anno.type === 'pencil' && anno.points) {
            // For pencil, check proximity to any point in the path
            for (const point of anno.points) {
              const distance = Math.sqrt(Math.pow(point.x - xStart, 2) + Math.pow(point.y - yStart, 2));
              if (distance <= 2) { // Tighter radius for pencil points
                removedAnnotation = anno;
                break;
              }
            }
            if (removedAnnotation) break;
          } else if (anno.type === 'arrow') {
            // For arrow, check proximity to the line
            const dx = anno.endX - anno.startX;
            const dy = anno.endY - anno.startY;
            // Calculate distance from point to line
            const length = Math.sqrt(dx * dx + dy * dy);
            if (length > 0) {
              // Normalized direction vector
              const nx = dx / length;
              const ny = dy / length;
              // Vector from start to click point
              const vx = xStart - anno.startX;
              const vy = yStart - anno.startY;
              // Project onto line
              const projection = nx * vx + ny * vy;
              // Clamp projection to line segment
              const projectionClamped = Math.max(0, Math.min(length, projection));
              // Get closest point on line
              const closestX = anno.startX + projectionClamped * nx;
              const closestY = anno.startY + projectionClamped * ny;
              // Distance from click to closest point
              const distance = Math.sqrt(Math.pow(xStart - closestX, 2) + Math.pow(yStart - closestY, 2));
              if (distance <= 3) { // 3% radius for arrow
                removedAnnotation = anno;
                break;
              }
            }
          }
        }
        
        if (removedAnnotation) {
          console.log("Eraser removed annotation:", removedAnnotation.id);
          if (onEraseAnnotation) {
            onEraseAnnotation(removedAnnotation.id);
          } else {
            // Fallback if no eraseAnnotation handler
            setAnnotations(annotations.filter(a => a.id !== removedAnnotation.id));
          }
          return;
        }
        
        // If we didn't find a direct hit, use the simple radius check as fallback
        const annotationsToKeep = annotations.filter(anno => {
          // Simple distance check for all annotation types
          const annoX = anno.x || anno.startX || 0;
          const annoY = anno.y || anno.startY || 0;
          const distance = Math.sqrt(Math.pow(annoX - xStart, 2) + Math.pow(annoY - yStart, 2));
          return distance > clickRadius;
        });
        
        if (annotationsToKeep.length < annotations.length) {
          console.log(`Eraser removed ${annotations.length - annotationsToKeep.length} annotations`);
          setAnnotations(annotationsToKeep);
        }
      }
      return; // No need to create a new annotation for eraser
    }
    
    const newAnnotation = { 
      id: Date.now().toString(), 
      type: selectedTool, 
      x: xStart, 
      y: yStart, 
      width: 0, 
      height: 0, 
      color: annotationColor || 'red',
      timestamp: currentTime, // Store timestamp
      points: selectedTool === 'pencil' ? [{ x: Number(xStart), y: Number(yStart) }] : null,
      // For arrow annotations, track start and end points
      ...(selectedTool === 'arrow' && { 
        startX: xStart,
        startY: yStart,
        endX: xStart,
        endY: yStart
      })
    };
    
    console.log("Started drawing annotation:", newAnnotation);
    
    // Start drawing
    setIsDrawing(true);
    setCurrentAnnotation(newAnnotation);
    setLastMove(Date.now());
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !currentAnnotation || !overlayRef.current) return;
    
    // If text input is visible, don't process other mouse events
    if (showTextInput) return;

    // Throttle mouse move events for better performance
    const now = Date.now();
    if (now - lastMove < 16 && currentAnnotation.type === 'pencil') { // ~60fps
      return;
    }
    setLastMove(now);

    const overlayRect = overlayRef.current.getBoundingClientRect();
    const x = ((e.clientX - overlayRect.left) / overlayRect.width) * 100;
    const y = ((e.clientY - overlayRect.top) / overlayRect.height) * 100;

    if (currentAnnotation.type === 'pencil') {
      // For pencil drawing, append points but don't add duplicates
      const lastPoint = currentAnnotation.points[currentAnnotation.points.length - 1];
      if (Math.abs(lastPoint.x - x) < 0.1 && Math.abs(lastPoint.y - y) < 0.1) {
        return; // Skip very small movements
      }
      
      const updatedPoints = [...(currentAnnotation.points || []), { x: Number(x), y: Number(y) }];
      setCurrentAnnotation({
        ...currentAnnotation,
        points: updatedPoints
      });
      
      // Debug only occasionally to avoid console spam
      if (updatedPoints.length % 10 === 0) {
        console.log(`Added point: (${x}, ${y}), Total points: ${updatedPoints.length}`);
      }
    } else if (currentAnnotation.type === 'arrow') {
      // For arrow, update the end position
      setCurrentAnnotation({
        ...currentAnnotation,
        endX: x,
        endY: y
      });
    } else {
      // For rectangular shapes, update width and height
      setCurrentAnnotation({
        ...currentAnnotation,
        width: x - currentAnnotation.x,
        height: y - currentAnnotation.y
      });
    }
  };

  const handleMouseUp = () => {
    // If text input is visible, don't process other mouse events
    if (showTextInput) return;
    
    if (isDrawing && currentAnnotation) {
      console.log("Finished drawing annotation:", currentAnnotation);
      
      // Determine if the annotation has valid content based on type
      let hasContent = false;
      
      if (currentAnnotation.type === 'pencil') {
        hasContent = currentAnnotation.points?.length > 1;
        
        // Ensure points are proper numbers before saving
        if (hasContent) {
          currentAnnotation.points = currentAnnotation.points.map(p => ({
            x: Number(p.x),
            y: Number(p.y)
          }));
        }
      } else if (currentAnnotation.type === 'arrow') {
        const dx = Math.abs(currentAnnotation.endX - currentAnnotation.startX);
        const dy = Math.abs(currentAnnotation.endY - currentAnnotation.startY);
        hasContent = Math.sqrt(dx*dx + dy*dy) > 5; // Minimum length of 5 pixels
      } else {
        hasContent = Math.abs(currentAnnotation.width) > 1 && Math.abs(currentAnnotation.height) > 1;
      }
      
      if (hasContent) {
        // Add the completed annotation to the collection
        if (typeof setAnnotations === 'function') {
          if (setAnnotations.length >= 2) {
            // It's likely a setState function
            setAnnotations(prev => [...prev, currentAnnotation]);
          } else {
            // It's likely a handler function
            setAnnotations(currentAnnotation);
          }
          
          // Notify selection
          if (onSelectAnnotation) {
            onSelectAnnotation(currentAnnotation.id);
          }
        }
      }
      
      // Reset the drawing state
      setIsDrawing(false);
      setCurrentAnnotation(null);
    }
  };

  // Handle text submission - explicitly isolated from other functions
  const handleTextSubmit = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log("Text submit called with input:", textInput);
    
    if (!textInput.trim()) {
      console.log("Empty text, closing input without creating annotation");
      setShowTextInput(false);
      return;
    }
    
    // Get current video time if player exists
    const currentTime = playerRef?.current ? Math.floor(playerRef.current.getCurrentTime()) : 0;
    
    // Create the text annotation
    const newAnnotation = {
      id: Date.now().toString(),
      type: 'text',
      x: textPosition.x,
      y: textPosition.y,
      text: textInput,
      color: annotationColor || 'red',
      timestamp: currentTime,
    };
    
    console.log("Creating text annotation:", newAnnotation);
    
    // Add the annotation
    if (typeof setAnnotations === 'function') {
      try {
        if (setAnnotations.length >= 2) {
          // It's likely a setState function
          setAnnotations(prev => {
            console.log("Adding annotation to previous state:", prev);
            return [...(Array.isArray(prev) ? prev : []), newAnnotation];
          });
        } else {
          // It's likely a handler function
          setAnnotations(newAnnotation);
        }
        
        // Notify selection
        if (onSelectAnnotation) {
          onSelectAnnotation(newAnnotation.id);
        }
        
        console.log("Successfully added text annotation");
      } catch (error) {
        console.error("Error adding text annotation:", error);
      }
    }
    
    // Clear input and hide the text input
    setTextInput('');
    setShowTextInput(false);
  };

  // Handle key press in text input
  const handleTextKeyPress = (e) => {
    if (e.key === 'Enter') {
      console.log("Enter key pressed in text input");
      e.preventDefault();
      handleTextSubmit(e);
    } else if (e.key === 'Escape') {
      console.log("Escape key pressed in text input");
      e.preventDefault();
      handleCancelText(e);
    }
  };

  // Handle cancel button click
  const handleCancelText = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log("Canceling text input");
    setTextInput('');
    setShowTextInput(false);
  };

  // Render annotations plus current one being drawn
  const renderAnnotations = () => {
    const allAnnotations = [];
    
    // Add existing annotations
    if (Array.isArray(annotations)) {
      annotations.forEach((anno, index) => {
        if (!anno || typeof anno !== 'object') return;
        
        if (anno.type === 'rectangle') {
          allAnnotations.push(
            <div
              key={`rect-${anno.id || index}`}
              className="annotation-box"
              onClick={(e) => handleAnnotationClick(anno.id, e)}
              style={{
                left: `${anno.x}%`,
                top: `${anno.y}%`,
                width: `${Math.abs(anno.width)}%`,
                height: `${Math.abs(anno.height)}%`,
                border: `2px solid ${anno.color}`,
                position: 'absolute',
                pointerEvents: 'auto',
                zIndex: 60
              }}
            />
          );
        } else if (anno.type === 'circle') {
          allAnnotations.push(
            <div
              key={`circle-${anno.id || index}`}
              className="annotation-circle"
              onClick={(e) => handleAnnotationClick(anno.id, e)}
              style={{
                left: `${anno.x}%`,
                top: `${anno.y}%`,
                width: `${Math.abs(anno.width)}%`,
                height: `${Math.abs(anno.height)}%`,
                border: `2px solid ${anno.color}`,
                borderRadius: '50%',
                position: 'absolute',
                pointerEvents: 'auto',
                zIndex: 60
              }}
            />
          );
        } else if (anno.type === 'pencil' && anno.points && anno.points.length > 0) {
          // Convert points to proper format and ensure they're numbers
          const formattedPoints = anno.points.map(p => ({
            x: typeof p.x === 'number' ? p.x : parseFloat(p.x || 0),
            y: typeof p.y === 'number' ? p.y : parseFloat(p.y || 0)
          }));
                    
          // Generate points string from formatted points
          const pointsString = createPointsString(formattedPoints);
          
          // FIXED: Use viewBox to ensure correct coordinate mapping
          allAnnotations.push(
            <svg 
              key={`pencil-${anno.id || index}`}
              className="annotation-pencil"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'auto',
                zIndex: 60
              }}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              onClick={(e) => handleAnnotationClick(anno.id, e)}
            >
              <polyline
                points={pointsString}
                style={{ 
                  stroke: anno.color || 'red',
                  strokeWidth: 1.5,
                  fill: 'none'
                }}
              />
            </svg>
          );
        } else if (anno.type === 'arrow') {
          // Calculate arrow head points
          const dx = anno.endX - anno.startX;
          const dy = anno.endY - anno.startY;
          const angle = Math.atan2(dy, dx);
          const length = Math.sqrt(dx * dx + dy * dy);
          
          // Only draw if it has some length
          if (length > 0) {
            const headLength = Math.min(5, length / 3); // Arrow head size
            const headAngle = Math.PI / 6; // 30 degrees
            
            const headX1 = anno.endX - headLength * Math.cos(angle - headAngle);
            const headY1 = anno.endY - headLength * Math.sin(angle - headAngle);
            const headX2 = anno.endX - headLength * Math.cos(angle + headAngle);
            const headY2 = anno.endY - headLength * Math.sin(angle + headAngle);
            
            allAnnotations.push(
              <svg 
                key={`arrow-${anno.id || index}`}
                className="annotation-arrow"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'auto',
                  zIndex: 60
                }}
                onClick={(e) => handleAnnotationClick(anno.id, e)}
              >
                <line 
                  x1={`${anno.startX}%`} 
                  y1={`${anno.startY}%`} 
                  x2={`${anno.endX}%`} 
                  y2={`${anno.endY}%`} 
                  stroke={anno.color || 'red'} 
                  strokeWidth="2"
                />
                <polygon 
                  points={`${anno.endX}%,${anno.endY}% ${headX1}%,${headY1}% ${headX2}%,${headY2}%`}
                  fill={anno.color || 'red'} 
                />
              </svg>
            );
          }
        } else if (anno.type === 'text') {
          // Debug text annotation
          console.log(`Rendering text annotation ${anno.id}: "${anno.text}" at (${anno.x}, ${anno.y})`);
          
          allAnnotations.push(
            <div
              key={`text-${anno.id || index}`}
              className="annotation-text"
              onClick={(e) => handleAnnotationClick(anno.id, e)}
              style={{
                position: 'absolute',
                top: `${anno.y}%`,
                left: `${anno.x}%`,
                transform: 'translate(-50%, -50%)',
                color: anno.color || 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: '5px 8px',
                borderRadius: '3px',
                maxWidth: '200px',
                wordWrap: 'break-word',
                textAlign: 'center',
                pointerEvents: 'auto',
                zIndex: 60,
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {anno.text}
            </div>
          );
        }
      });
    }
    
    // Add the annotation currently being drawn
    if (isDrawing && currentAnnotation) {
      if (currentAnnotation.type === 'rectangle') {
        allAnnotations.push(
          <div
            key="drawing-rect"
            className="annotation-box drawing"
            style={{
              left: `${currentAnnotation.x}%`,
              top: `${currentAnnotation.y}%`,
              width: `${Math.abs(currentAnnotation.width)}%`,
              height: `${Math.abs(currentAnnotation.height)}%`,
              border: `2px solid ${currentAnnotation.color}`,
              position: 'absolute',
              zIndex: 70
            }}
          />
        );
      } else if (currentAnnotation.type === 'circle') {
        allAnnotations.push(
          <div
            key="drawing-circle"
            className="annotation-circle drawing"
            style={{
              left: `${currentAnnotation.x}%`,
              top: `${currentAnnotation.y}%`,
              width: `${Math.abs(currentAnnotation.width)}%`,
              height: `${Math.abs(currentAnnotation.height)}%`,
              border: `2px solid ${currentAnnotation.color}`,
              borderRadius: '50%',
              position: 'absolute',
              zIndex: 70
            }}
          />
        );
      } else if (currentAnnotation.type === 'pencil' && currentAnnotation.points && currentAnnotation.points.length > 0) {
        // Convert points to numbers for the current drawing
        const formattedPoints = currentAnnotation.points.map(p => ({
          x: typeof p.x === 'number' ? p.x : parseFloat(p.x || 0),
          y: typeof p.y === 'number' ? p.y : parseFloat(p.y || 0)
        }));
        
        allAnnotations.push(
          <svg 
            key="drawing-pencil"
            className="annotation-pencil drawing"
            ref={svgRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 70
            }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polyline
              points={createPointsString(formattedPoints)}
              style={{ 
                stroke: currentAnnotation.color,
                strokeWidth: 1.5,
                fill: 'none'
              }}
            />
          </svg>
        );
      } else if (currentAnnotation.type === 'arrow') {
        // Calculate arrow head points for current drawing
        const dx = currentAnnotation.endX - currentAnnotation.startX;
        const dy = currentAnnotation.endY - currentAnnotation.startY;
        const angle = Math.atan2(dy, dx);
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length > 0) {
          const headLength = Math.min(5, length / 3);
          const headAngle = Math.PI / 6; // 30 degrees
          
          const headX1 = currentAnnotation.endX - headLength * Math.cos(angle - headAngle);
          const headY1 = currentAnnotation.endY - headLength * Math.sin(angle - headAngle);
          const headX2 = currentAnnotation.endX - headLength * Math.cos(angle + headAngle);
          const headY2 = currentAnnotation.endY - headLength * Math.sin(angle + headAngle);
          
          allAnnotations.push(
            <svg 
              key="drawing-arrow"
              className="annotation-arrow drawing"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 70
              }}
            >
              <line 
                x1={`${currentAnnotation.startX}%`} 
                y1={`${currentAnnotation.startY}%`} 
                x2={`${currentAnnotation.endX}%`} 
                y2={`${currentAnnotation.endY}%`} 
                stroke={currentAnnotation.color} 
                strokeWidth="2"
              />
              <polygon 
                points={`${currentAnnotation.endX}%,${currentAnnotation.endY}% ${headX1}%,${headY1}% ${headX2}%,${headY2}%`}
                fill={currentAnnotation.color} 
              />
            </svg>
          );
        }
      }
    }
    
    return allAnnotations;
  };
  
  const handleAnnotationClick = (id, e) => {
    e.stopPropagation();
    if (onSelectAnnotation) {
      console.log("Selected annotation:", id);
      onSelectAnnotation(id);
    }
  };

  return (
    <>
      <div
        className="annotation-overlay"
        ref={overlayRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: selectedTool ? 'auto' : 'none',
          zIndex: 50
        }}
      >
        {renderAnnotations()}
        
        {/* Show cursor indicator for eraser */}
        {selectedTool === 'eraser' && (
          <div 
            className="eraser-cursor"
            style={{
              position: 'absolute',
              pointerEvents: 'none',
              zIndex: 100
            }}
          />
        )}
      </div>
      
      {/* Render text input outside the overlay for better event handling */}
      {showTextInput && (
        <div 
          className="text-input-modal"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            pointerEvents: 'none'
          }}
        >
          <div 
            className="text-input-overlay"
            style={{
              position: 'absolute',
              top: `${textPosition.y}%`,
              left: `${textPosition.x}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 1001,
              pointerEvents: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={textInputRef}
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleTextKeyPress}
              placeholder="Enter text..."
              className="text-annotation-input"
              autoFocus
            />
            <div className="text-input-buttons">
              <button 
                type="button" 
                onClick={handleTextSubmit}
                onMouseDown={(e) => e.stopPropagation()}
              >
                Add
              </button>
              <button 
                type="button" 
                onClick={handleCancelText}
                onMouseDown={(e) => e.stopPropagation()}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AnnotationOverlay;