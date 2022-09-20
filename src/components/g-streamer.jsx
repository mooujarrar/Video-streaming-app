import axios from 'axios';
import React, { useCallback, useEffect } from 'react';
import { useState } from 'react';

function GStreamer() {
    
  const handleUnload = useCallback((e) => {
    e?.preventDefault();
    console.log('component unmounted');
    axios('http://localhost:9001/stop');
  }, []);

  useEffect(() => {
    console.log('component mounted');
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [handleUnload]);

  useEffect(() => {
    return () => handleUnload();
  }, []);

  return (
    <div className="flex-grow-1 d-flex align-items-center justify-content-center">
      <div className="d-flex flex-column align-items-center justify-content-center">
        <video controls muted autoPlay={'autoplay'} preload={'preload'} loop>
          <source src="http://localhost:9001/stream" type="video/webm" />
        </video>
      </div>
    </div>
  );
}

export default GStreamer;
