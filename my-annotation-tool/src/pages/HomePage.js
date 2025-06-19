import React, { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import YouTube from "react-youtube";
import Toolbar from "../components/Toolbar.js";
import AnnotationOverlay from "../components/AnnotationOverlay.js";
import SimpleCommentSection from "../components/SimpleCommentSection.js";
import SharedAnnotationsPanel from "../components/SharedAnnotationsPanel.js";
import { getAnnotations, saveAnnotations } from "../api.js";
import { useAuth } from '../context/AuthContext.js';
import Login from '../components/Login.js';
import Register from '../components/Register.js';
import ResetPassword from '../components/ResetPassword.js';
import "./HomePage.css";

const HomePage = () => {
  // Auth state
  const { user, loading, logout } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  
  // Annotation tool state
  const [selectedTool, setSelectedTool] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [visibleAnnotations, setVisibleAnnotations] = useState([]);
  const [undoStack, setUndoStack] = useState([]); 
  const [redoStack, setRedoStack] = useState([]); 
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [comments, setComments] = useState({});
  const [annotationColor, setAnnotationColor] = useState("#FF0000");
  const [mouseMode, setMouseMode] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [showAllAnnotations, setShowAllAnnotations] = useState(false);
  
  // Shared annotations state
  const [showSharedPanel, setShowSharedPanel] = useState(false);
  const [viewingUserId, setViewingUserId] = useState(null);
  const [viewingUsername, setViewingUsername] = useState(null);
  const [myAnnotations, setMyAnnotations] = useState([]); // Store user's annotations when viewing others'

  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState(null);
  const playerRef = useRef(null);
  const videoContainerRef = useRef(null);
  const timerRef = useRef(null);

  // Debug current state
  useEffect(() => {
    if (!user) return; // Skip if not logged in
    
    console.log("Current state:", {
      selectedTool,
      mouseMode,
      annotationsCount: annotations.length,
      undoStackSize: undoStack.length,
      redoStackSize: redoStack.length
    });
  }, [selectedTool, mouseMode, annotations.length, undoStack.length, redoStack.length, user]);

  // Update iframe pointer-events when mouseMode changes
  useEffect(() => {
    if (!user) return; // Skip if not logged in
    
    const iframe = document.querySelector('.video-container iframe');
    if (iframe) {
      iframe.style.pointerEvents = mouseMode ? 'auto' : 'none';
      console.log("Set iframe pointer-events to", mouseMode ? 'auto' : 'none');
    }
  }, [mouseMode, user]);

  // Extract YouTube Video ID
  const extractVideoId = (url) => {
    const regex =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/;
    const match = url.match(regex);
    return match ? match[1].split("?")[0] : null;
  };

  // Start timer to track video playback position
  const startVideoTimeTracking = () => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Create a new timer that runs every 250ms
    timerRef.current = setInterval(() => {
      if (playerRef.current) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
      }
    }, 250);
  };

  // Clean up timer when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Filter annotations to show only those at the current timestamp +/- 3 seconds
  useEffect(() => {
    if (!user || !annotations || annotations.length === 0) return;
    
    if (showAllAnnotations) {
      setVisibleAnnotations(annotations);
      return;
    }

    const timeWindow = 3; // Show annotations for 3 seconds
    
    const filtered = annotations.filter(annotation => {
      const timestamp = annotation.timestamp || 0;
      return currentTime >= timestamp && currentTime <= timestamp + timeWindow;
    });

    console.log("Current time:", currentTime, "Visible annotations:", filtered.length);
    setVisibleAnnotations(filtered);
  }, [currentTime, annotations, showAllAnnotations, user]);

  // Fetch stored annotations & comments
  const fetchAnnotations = useCallback(async () => {
    if (!user || !videoId) return;
    
    try {
      const data = await getAnnotations(videoId);
      console.log("🔹 Fetched data:", data);
      
      // Process the data from MongoDB
      const fetchedAnnotations = [];
      let fetchedComments = {};
      
      // Check if data is an array (multiple documents) or single object
      const items = Array.isArray(data) ? data : [data];
      
      items.forEach(item => {
        if (item && item.annotations) {
          // Add annotations to the array
          item.annotations.forEach(anno => {
            // Each annotation needs an id for reference
            if (!anno.id && anno._id) {
              anno.id = anno._id.toString();
            } else if (!anno.id) {
              anno.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            }
            fetchedAnnotations.push(anno);
          });
          
          // Process comments for this annotation
          if (item.comments) {
            // The backend should now return comments already organized by annotation ID
            fetchedComments = { ...fetchedComments, ...item.comments };
            
            // Debug the comments structure
            console.log("Comments received from server:", item.comments);
            Object.keys(item.comments).forEach(key => {
              console.log(`Comments for annotation ${key}:`, 
                Array.isArray(item.comments[key]) ? item.comments[key].length : "not an array");
            });
          }
        }
      });

      console.log("Processed annotations:", fetchedAnnotations.length);
      console.log("Processed comments:", Object.keys(fetchedComments).length, "annotation IDs with comments");
      
      // Debug the first annotation's comments if we have any
      if (fetchedAnnotations.length > 0) {
        const firstAnnoId = fetchedAnnotations[0].id;
        console.log(`First annotation ID: ${firstAnnoId}`);
        console.log(`Comments for first annotation:`, 
          fetchedComments[firstAnnoId] ? fetchedComments[firstAnnoId].length : "none");
      }
      
      setAnnotations(fetchedAnnotations);
      setMyAnnotations(fetchedAnnotations); // Store user's own annotations
      setComments(fetchedComments);
      
      // Reset undo/redo stacks when loading new data
      setUndoStack([]);
      setRedoStack([]);

      if (fetchedAnnotations.length > 0) {
        setSelectedAnnotation(fetchedAnnotations[0].id);
      }
    } catch (error) {
      console.error("❌ Error fetching annotations:", error);
    }
  }, [videoId, user]);

  useEffect(() => {
    fetchAnnotations();
  }, [videoId, fetchAnnotations]);

  // Handle viewing another user's annotations
  const handleViewUserAnnotations = (userAnnotation) => {
    // Save current user's annotations before switching
    if (!viewingUserId) {
      setMyAnnotations([...annotations]);
    }
    
    // Set the annotations to show in the overlay
    setAnnotations(userAnnotation.annotations);
    setViewingUserId(userAnnotation.userId);
    setViewingUsername(userAnnotation.username);
    setShowSharedPanel(false);
    
    // Clear undo/redo stacks since we're viewing someone else's annotations
    setUndoStack([]);
    setRedoStack([]);
    
    // Ensure we can't modify another user's annotations
    setMouseMode(true);
  };

  // Reset to your own annotations
  const resetToMyAnnotations = () => {
    setViewingUserId(null);
    setViewingUsername(null);
    
    // Restore user's own annotations
    if (myAnnotations.length > 0) {
      setAnnotations(myAnnotations);
      if (myAnnotations[0]?.id) {
        setSelectedAnnotation(myAnnotations[0].id);
      }
      console.log("Restored user's annotations:", myAnnotations.length);
    } else {
      // Re-fetch if we don't have stored annotations
      fetchAnnotations();
    }
    
    // Clear undo/redo stacks since we're resetting
    setUndoStack([]);
    setRedoStack([]);
  };

  // Load video and fetch stored annotations
  const handleVideoSubmit = () => {
    const extractedId = extractVideoId(videoUrl);
    if (extractedId) {
      setVideoId(extractedId);
      // Reset viewing state when loading a new video
      setViewingUserId(null);
      setViewingUsername(null);
      setMyAnnotations([]);
    } else {
      alert("Invalid YouTube URL.");
    }
  };

  // Direct tool selection handlers for debugging
  const handleToolSelect = (tool) => {
    // Don't allow editing if viewing another user's annotations
    if (viewingUserId) {
      alert("You cannot edit another user's annotations. Switch back to your own annotations first.");
      return;
    }
    
    console.log("Before setting tool:", { currentTool: selectedTool, mouseMode });
    setMouseMode(false);
    setSelectedTool(tool);
    console.log("After setting tool:", { newTool: tool, mouseMode: false });
  };

  // Toggle between mouse mode and annotation mode
  const toggleMouseMode = () => {
    // Don't allow editing if viewing another user's annotations
    if (viewingUserId && !mouseMode) {
      alert("You cannot edit another user's annotations. Switch back to your own annotations first.");
      setMouseMode(true);
      return;
    }
    
    const newMouseMode = !mouseMode;
    setMouseMode(newMouseMode);
    console.log("Mouse Mode toggled:", newMouseMode ? "ON" : "OFF");
    
    if (newMouseMode) {
      // Disable drawing when in mouse mode
      setSelectedTool(null);
    }
  };

  // Updated Handle Undo function
  const handleUndo = () => {
    // Don't allow editing if viewing another user's annotations
    if (viewingUserId) {
      alert("You cannot edit another user's annotations. Switch back to your own annotations first.");
      return;
    }
    
    if (undoStack.length === 0) {
      console.log("Nothing to undo");
      return;
    }
    
    console.log("Undo: popping state from stack with", undoStack.length, "items");
    
    // Get last state from undo stack
    const previousState = undoStack[undoStack.length - 1];
    
    // Save current state to redo stack
    setRedoStack(prev => [...prev, [...annotations]]);
    
    // Update undo stack (remove the state we just used)
    setUndoStack(prev => prev.slice(0, -1));
    
    // Restore previous state
    setAnnotations(previousState);
    
    console.log("Undone. Undo stack now has", undoStack.length - 1, "items");
  };

  // Updated Handle Redo function
  const handleRedo = () => {
    // Don't allow editing if viewing another user's annotations
    if (viewingUserId) {
      alert("You cannot edit another user's annotations. Switch back to your own annotations first.");
      return;
    }
    
    if (redoStack.length === 0) {
      console.log("Nothing to redo");
      return;
    }
    
    console.log("Redo: popping state from stack with", redoStack.length, "items");
    
    // Get last state from redo stack
    const nextState = redoStack[redoStack.length - 1];
    
    // Save current state to undo stack
    setUndoStack(prev => [...prev, [...annotations]]);
    
    // Update redo stack (remove the state we just used)
    setRedoStack(prev => prev.slice(0, -1));
    
    // Restore next state
    setAnnotations(nextState);
    
    console.log("Redone. Redo stack now has", redoStack.length - 1, "items");
  };

  // Handle selecting an annotation
  const handleSelectAnnotation = (id) => {
    console.log("Selected annotation ID:", id);
    setSelectedAnnotation(id);
    
    // Debug info about selected annotation's comments
    if (id && comments[id]) {
      console.log(`Found ${comments[id].length} comments for annotation ${id}:`, comments[id]);
    } else {
      console.log(`No comments found for annotation ${id}`);
    }
  };

  // Handle erasing an annotation with undo support
  const handleEraseAnnotation = (annotationId) => {
    // Save current state to undo stack
    setUndoStack(prev => [...prev, [...annotations]]);
    
    // Remove the annotation
    setAnnotations(prev => prev.filter(anno => anno.id !== annotationId));
    
    // Clear redo stack when making a new change
    setRedoStack([]);
    
    console.log(`Erased annotation ${annotationId}, added to undo stack`);
  };

  // Handle adding comments with direct state updates and immediate save
  const handleAddComment = (id, comment, videoTime) => {
    // Don't allow commenting if viewing another user's annotations
    if (viewingUserId) {
      alert("You cannot comment on another user's annotations. Switch back to your own annotations first.");
      return;
    }
    
    if (!id) {
      console.warn("No annotation ID specified for comment");
      return;
    }
    
    const commentKey = id;
    const newComment = {
      text: comment,
      timestamp: new Date().toLocaleString(),
      videoTime: videoTime || currentTime, // Store the current video timestamp
      userId: user.id || user._id,
      username: user.username,
      annotationId: id,
      _id: Date.now().toString()
    };
    
    console.log(`Adding comment to ${commentKey} at video time ${newComment.videoTime}:`, newComment);
    
    // Create a brand new comments object for React to detect the change
    const updatedComments = {...comments};
    
    if (!updatedComments[commentKey]) {
      updatedComments[commentKey] = [];
    }
    
    updatedComments[commentKey] = [...updatedComments[commentKey], newComment];
    
    // Set state
    setComments(updatedComments);
    console.log("Updated comments state:", updatedComments);
    
    // Important: Save to database immediately to prevent loss on refresh
    if (annotations.length > 0 && videoId) {
      // Get the user ID (handling both formats)
      const userId = user.id || user._id;
      
      // Add our annotations with timestamps
      const annotationsToSave = annotations.map(anno => ({
        ...anno,
        timestamp: anno.timestamp || Math.floor(playerRef.current.getCurrentTime()),
        userId: userId
      }));
      
      // Save to the database with the updated comments
      saveAnnotations(videoId, annotationsToSave, updatedComments, userId)
        .then(() => {
          console.log("✅ Comments saved to database");
        })
        .catch(error => {
          console.error("❌ Failed to save comments:", error);
        });
    }
  };

  // Create a new annotation with user ID and update undo stack
  const handleCreateAnnotation = (newAnnotation) => {
    // Don't allow editing if viewing another user's annotations
    if (viewingUserId) {
      alert("You cannot add annotations to another user's work. Switch back to your own annotations first.");
      return;
    }
    
    // Ensure each annotation has an ID
    if (!newAnnotation.id) {
      newAnnotation.id = Date.now().toString();
    }
    
    // Add the user ID to the annotation
    const userId = user.id || user._id;
    newAnnotation.userId = userId;
    
    // Get timestamp if it doesn't have one
    if (!newAnnotation.timestamp && playerRef.current) {
      newAnnotation.timestamp = Math.floor(playerRef.current.getCurrentTime());
    }
    
    // Save current state to undo stack
    setUndoStack(prev => [...prev, [...annotations]]);
    
    // Add to annotations
    setAnnotations(prev => [...prev, newAnnotation]);
    
    // Select the new annotation
    setSelectedAnnotation(newAnnotation.id);
    
    // Clear redo stack when making a new change
    setRedoStack([]);
    
    console.log("Created new annotation with userId:", newAnnotation);
    console.log("Undo stack size:", undoStack.length + 1);
  };

  // Updated Save annotations & comments to DB with timestamps and user ID
  const handleSaveAnnotations = async () => {
    // Don't allow saving if viewing another user's annotations
    if (viewingUserId) {
      alert("You cannot save changes to another user's annotations. Switch back to your own annotations first.");
      return;
    }
    
    if (!videoId) {
      alert("No video loaded.");
      return;
    }
    
    // Debug user object
    console.log("Current user:", user);
    
    try {
      // Make sure user info is available
      if (!user || (!user.id && !user._id)) {
        console.error("User ID is missing:", user);
        alert("User information is missing. Please log in again.");
        return;
      }
      
      // Get the user ID (handling both formats)
      const userId = user.id || user._id;
      
      const annotationsToSave = annotations.map(anno => ({
        ...anno,
        timestamp: anno.timestamp || Math.floor(playerRef.current.getCurrentTime()),
        userId: userId // Add user ID to each annotation
      }));
      
      console.log("Saving annotations with timestamps:", annotationsToSave);
      console.log("Saving comments:", comments);
      console.log("User ID:", userId);
      
      // Include userId in the API call
      await saveAnnotations(videoId, annotationsToSave, comments, userId);
      alert("✅ Annotations and comments saved successfully!");
      
      // Update myAnnotations with the saved data
      setMyAnnotations(annotationsToSave);
    } catch (error) {
      console.error("❌ Error saving annotations:", error);
      alert("❌ Error saving annotations.");
    }
  };

  // Debug comments when they change
  useEffect(() => {
    if (!user) return;
    console.log("Comments state updated:", comments);
  }, [comments, user]);

  // Debug selected annotation and its comments
  useEffect(() => {
    if (!user || !selectedAnnotation) return;
    console.log("Selected annotation:", selectedAnnotation);
    console.log("Comments for selected annotation:", comments[selectedAnnotation] || []);
  }, [selectedAnnotation, comments, user]);

  // Render login/register page if not authenticated
  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="auth-container">
        {showRegister ? (
          <Register 
            onRegisterSuccess={() => {
              console.log("Registration successful, refreshing state");
              // Force a refresh of the auth state
              window.location.reload();
            }} 
            switchToLogin={() => setShowRegister(false)} 
          />
        ) : showResetPassword ? (
          <ResetPassword
            switchToLogin={() => {
              setShowResetPassword(false);
              setShowRegister(false);
            }}
          />
        ) : (
          <Login 
            onLoginSuccess={() => {
              console.log("Login successful, refreshing state");
              // Force a refresh of the auth state
              window.location.reload();
            }} 
            switchToRegister={() => setShowRegister(true)}
            switchToResetPassword={() => setShowResetPassword(true)}
          />
        )}
      </div>
    );
  }

  // Render main app for authenticated users
  return (
    <div className="home-page">
      {/* Updated user bar with buttons properly spaced */}
      <div className="user-bar">
        <span>Welcome, {user.username}</span>
        
        <div className="user-bar-buttons">
          {/* Add Admin Dashboard link for admin users */}
          {user.isAdmin && (
            <Link to="/admin" className="admin-link">Admin Dashboard</Link>
          )}
          
          {/* Add shared annotations button if video is loaded */}
          {videoId && (
            <button
              onClick={() => setShowSharedPanel(true)}
              className="shared-annotations-button"
            >
              View Others' Annotations
            </button>
          )}
          
          <button onClick={logout} className="logout-button">Logout</button>
        </div>
      </div>
      
      {/* Viewing another user's annotations banner */}
      {viewingUserId && (
        <div className="viewing-user-banner">
          <p>Viewing {viewingUsername}'s annotations (read-only)</p>
          <button onClick={resetToMyAnnotations} className="view-my-annotations-button">
            Back to My Annotations
          </button>
        </div>
      )}
      
      <h1>Welcome to the YouTube Annotation Tool</h1>
      <div className="video-input">
        <input 
          type="text" 
          placeholder="Paste YouTube link here..." 
          value={videoUrl} 
          onChange={(e) => setVideoUrl(e.target.value)} 
        />
        <button onClick={handleVideoSubmit}>Load Video</button>
      </div>

      {videoId && (
        <>
          {/* Updated to use the Toolbar component with mouse mode toggle */}
          <Toolbar 
            selectedTool={selectedTool} 
            setSelectedTool={handleToolSelect}
            handleUndo={handleUndo}
            handleRedo={handleRedo} 
            disabled={!!viewingUserId}
            mouseMode={mouseMode}
            toggleMouseMode={toggleMouseMode}
          />

          {/* Color picker and show all annotations options */}
          <div className="options-row">
            <div className="color-picker">
              <label>Color:</label>
              <input 
                type="color" 
                value={annotationColor} 
                onChange={(e) => setAnnotationColor(e.target.value)} 
                disabled={!!viewingUserId}
              />
            </div>
            
            <div className="annotation-display-toggle">
              <label>
                <input 
                  type="checkbox" 
                  checked={showAllAnnotations} 
                  onChange={() => setShowAllAnnotations(!showAllAnnotations)} 
                />
                Show All Annotations
              </label>
            </div>
          </div>

          <div className="video-container" ref={videoContainerRef}>
            <YouTube 
              videoId={videoId} 
              opts={{ 
                height: "600", 
                width: "1000", 
                playerVars: { 
                  autoplay: 0,
                  modestbranding: 1,
                  controls: 1,
                  disablekb: 1,
                  rel: 0
                } 
              }} 
              onReady={(event) => {
                playerRef.current = event.target;
                // Get the iframe and set pointer-events
                const iframe = document.querySelector('.video-container iframe');
                if (iframe) {
                  iframe.style.pointerEvents = mouseMode ? 'auto' : 'none';
                }
                // Start tracking time once the player is ready
                startVideoTimeTracking();
              }}
              onPlay={() => startVideoTimeTracking()}
              onPause={() => {
                if (timerRef.current) {
                  clearInterval(timerRef.current);
                }
              }}
              onEnd={() => {
                if (timerRef.current) {
                  clearInterval(timerRef.current);
                }
              }}
            />
            
            {/* Test overlay to debug click events */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(255,0,0,0.05)',
                zIndex: 45,
                pointerEvents: mouseMode ? 'none' : 'auto'
              }}
              onClick={() => console.log('Test overlay clicked')}
            >
              {!mouseMode && (
                <div style={{
                  color: 'white', 
                  padding: '10px', 
                  background: 'rgba(0,0,0,0.7)',
                  position: 'absolute',
                  top: 0,
                  right: 0
                }}>
                  DRAW MODE ACTIVE
                </div>
              )}
            </div>
            
            <div 
              className={`annotation-overlay-wrapper ${mouseMode ? "mouse-mode" : "draw-mode"}`}
            >
              <AnnotationOverlay 
                selectedTool={mouseMode ? null : selectedTool}
                annotations={visibleAnnotations} // Only show visible annotations
                setAnnotations={handleCreateAnnotation} // Use the handler function
                onSelectAnnotation={handleSelectAnnotation}
                onEraseAnnotation={handleEraseAnnotation} // Add this prop for eraser
                annotationColor={annotationColor}
                playerRef={playerRef} // Pass the playerRef to AnnotationOverlay
              />
              {mouseMode && <div className="mouse-mode-indicator">Mouse Mode: Click video to interact</div>}
            </div>
          </div>

          <div className="video-info">
            <span>Current Time: {currentTime.toFixed(2)}s</span>
            <span>Visible: {visibleAnnotations.length}</span>
            <span>Total: {annotations.length}</span>
          </div>

          {/* Only show save button when viewing own annotations */}
          {!viewingUserId && (
            <button onClick={handleSaveAnnotations} className="save-button">
              Save Annotations
            </button>
          )}

          {/* Display comments for the selected annotation - Updated to pass currentTime */}
          <SimpleCommentSection 
            annotationId={selectedAnnotation} 
            comments={comments} 
            handleAddComment={(id, comment) => handleAddComment(id, comment, currentTime)}
            readOnly={!!viewingUserId} // Make comment section read-only when viewing others' annotations
            currentTime={currentTime} // Pass the current video time
          />
        </>
      )}
      
      {/* Shared annotations panel */}
      {showSharedPanel && (
        <>
          <div className="overlay" onClick={() => setShowSharedPanel(false)}></div>
          <SharedAnnotationsPanel 
            videoId={videoId}
            onClose={() => setShowSharedPanel(false)}
            onSelectUserAnnotations={handleViewUserAnnotations}
          />
        </>
      )}
    </div>
  );
};

export default HomePage;