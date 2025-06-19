import React from 'react';
import ReactPlayer from 'react-player';

function VideoPlayer() {
  return (
    <div className="video-player">
      <ReactPlayer 
        url="https://www.youtube.com/watch?v=CoQ4yGl7LtQ" 
        controls={true} 
        width="100%" 
        height="480px" 
      />
    </div>
  );
}

export default VideoPlayer;
