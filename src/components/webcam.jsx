import React from 'react';
import useSocket from './effects/socket';

function WebCam() {
  const { isConnected, frame } = useSocket('live');

  return (
    <div className='flex-grow-1 d-flex align-items-center justify-content-center'>
      {isConnected ? 
        (
          <div className='d-flex flex-column align-items-center justify-content-center'>
            
            <h1 className="h3 text-success">
              Connected, Mode: {" "}<i className="bi bi-webcam"></i> 
            </h1>
            <img width={700} id="image" src={frame} alt="frame" />
          </div>) : 
        (
          <div className='d-flex flex-column align-items-center justify-content-center'>
            <div className="spinner-grow text-primary" role="status"></div>
            <h1 className="display-6 text-primary">Connect to the streaming server...</h1>
          </div>
        )}
    </div>
  );
}

export default WebCam;
