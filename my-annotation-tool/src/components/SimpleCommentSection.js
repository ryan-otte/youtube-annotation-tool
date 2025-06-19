import React, { useState, useEffect } from 'react';
import './CommentsSection.css';

const SimpleCommentSection = ({ annotationId, comments, handleAddComment, readOnly = false, currentTime = 0 }) => {
  const [newComment, setNewComment] = useState('');
  const [localComments, setLocalComments] = useState([]);

  // Update local comments when props change
  useEffect(() => {
    // Debug the comments structure
    console.log(`SimpleCommentSection for annotation ${annotationId}:`, {
      commentsType: typeof comments,
      allKeys: comments ? Object.keys(comments) : [],
      hasSelectedAnnotation: comments && annotationId ? annotationId in comments : false
    });
    
    // Check if we have a valid annotation ID and comments object
    if (!annotationId || !comments) {
      setLocalComments([]);
      return;
    }

    // Get comments for this specific annotation ID
    if (comments[annotationId] && Array.isArray(comments[annotationId])) {
      console.log(`Setting ${comments[annotationId].length} comments for annotation ${annotationId}`);
      setLocalComments(comments[annotationId]);
    } else {
      console.log(`No comments found for annotation ${annotationId}`);
      setLocalComments([]);
    }
  }, [comments, annotationId]);

  // Add comment handler
  const onAddComment = () => {
    if (!newComment.trim()) return;
    if (!annotationId) {
      alert("Please select an annotation first");
      return;
    }
    
    // Call parent handler
    handleAddComment(annotationId, newComment, currentTime);
    
    // Clear the input
    setNewComment('');
  };

  // Sort comments by timestamp (oldest first)
  const sortedComments = [...localComments].sort((a, b) => {
    // Try to parse timestamps and compare
    try {
      return new Date(a.timestamp) - new Date(b.timestamp);
    } catch (e) {
      // Fallback to string comparison if parsing fails
      return a.timestamp.localeCompare(b.timestamp);
    }
  });

  // Format video timestamp as MM:SS
  const formatVideoTime = (seconds) => {
    if (seconds === undefined || seconds === null) return "00:00";
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="comment-section">
      <h3>Comments for Annotation #{annotationId || "N/A"}</h3>
      
      {!readOnly && (
        <div className="comment-input">
          <textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={!annotationId || readOnly}
          ></textarea>
          <button 
            onClick={onAddComment} 
            disabled={!annotationId || !newComment.trim() || readOnly}
          >
            Add Comment
          </button>
        </div>
      )}
      
      <div className="comment-list">
        {/* Show comments */}
        {sortedComments && sortedComments.length > 0 ? (
          sortedComments.map((comment, i) => (
            <div 
              key={`comment-${comment._id || `${annotationId}-${i}`}`} 
              className="comment-item"
            >
              <div className="comment-header">
                <span className="comment-username">{comment.username || 'Anonymous'}</span>
                <div className="comment-timestamps">
                  <span className="comment-time">{comment.timestamp}</span>
                  {comment.videoTime && (
                    <span className="video-time">at {formatVideoTime(comment.videoTime)}</span>
                  )}
                </div>
              </div>
              <p className="comment-text">{comment.text}</p>
            </div>
          ))
        ) : (
          <p>No comments yet. Add a comment to get started!</p>
        )}
      </div>
    </div>
  );
};

export default SimpleCommentSection;