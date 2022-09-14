import React from 'react';

function VideoStreaming() {

  return (
    <div className='flex-grow-1 d-flex align-items-center justify-content-center'>        
          <div className='d-flex flex-column align-items-center justify-content-center'>
            <h1 className="h3 text-success">
              Mode: {" "}<i className="bi bi-film"></i>
            </h1>
            <video src="http://localhost:5000/video" width="1080" controls></video>    
          </div>
    </div>
  );
}

export default VideoStreaming;
