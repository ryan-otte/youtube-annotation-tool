import React, { useState } from 'react';
import './CommentsSection.css';

const CommentSection = ({ annotationId, comments, handleAddComment }) => {
  const [newComment, setNewComment] = useState('');

  const handleInputChange = (e) => {
    setNewComment(e.target.value);
  };

  const onAddComment = () => {
    if (newComment.trim()) {
      handleAddComment(annotationId, newComment.trim()); // ✅ Send only the text, not an object
      setNewComment(''); // ✅ Clear the input field after adding comment
    }
  };

  return (
    <div className="comment-section">
      <h3>Comments for Annotation #{annotationId || "N/A"}</h3>
      <div className="comment-input">
        <textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={handleInputChange}
        ></textarea>
        <button onClick={onAddComment}>Add Comment</button>
      </div>
      <div className="comment-list">
        {comments.length > 0 ? (
          comments.map((comment, index) => (
            <div key={index} className="comment-item">
              <p>{comment.text}</p>
              <span>{comment.timestamp}</span>
            </div>
          ))
        ) : (
          <p>No comments yet. Add a comment to get started!</p>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
