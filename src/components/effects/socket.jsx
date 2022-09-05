import { useState, useEffect, useRef } from 'react';
import { w3cwebsocket as W3CWebSocket } from "websocket";

function useSocket(type) {
    const ws = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [frame, setFrame] = useState();

    useEffect(() => {
      ws.current = new W3CWebSocket('ws://localhost:3030', 'echo-protocol');
      ws.current.onopen = () =>  {setIsConnected(true); console.log("ws opened")};
      ws.current.onclose = () => {setIsConnected(false); console.log("ws closed")};
  
      const wsCurrent = ws.current;
  
      return () => {
        setIsConnected(false);
        wsCurrent.close();
      };
    }, []);

    useEffect(() => {
      if(isConnected && ws.current.readyState === ws.current.OPEN) ws.current.send(type);
    }, [type, isConnected])
  
    useEffect(() => {
      if (!ws.current) return;
      
      ws.current.onmessage = e => {
          if (!isConnected) return;
          setFrame( `${type === 'live' ? 'data:image/jpeg;base64' : 'data:video/mp4;base64'},${e.data}`);
      };
    }, [isConnected]);
  
    return { isConnected, frame };
}

export default useSocket;