const cv2 = require('opencv4nodejs');
const http = require('http');

const server = http.createServer();
server.listen(3030, () => console.log(`Streaming server is launched under port ${3030}`));

const webSocketServer = require('websocket').server;

const wsServer = new webSocketServer({
    httpServer: server
});

function originIsAllowed(origin) {
    // put logic here to detect whether the specified origin is allowed.
    return true;
}

const FPS = 30;

const liveCapture = new cv2.VideoCapture(0);
liveCapture.set(cv2.CAP_PROP_FRAME_WIDTH, 300);
liveCapture.set(cv2.CAP_PROP_FRAME_HEIGHT, 300);

const videoReader = new cv2.VideoCapture('./assets/Media1.mp4');
videoReader.set(cv2.CAP_PROP_FRAME_WIDTH, 300);
videoReader.set(cv2.CAP_PROP_FRAME_HEIGHT, 300);

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    var connection = request.accept('echo-protocol', request.origin);
    let interval1, interval2;
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            if(message.utf8Data === 'live') {
                clearInterval(interval2);
                interval1 = setInterval(() => {
                    const frame = liveCapture.read();
                    const image = cv2.imencode('.jpg', frame).toString('base64');
                    connection.send(image);
                }, 1000 / FPS);
            } else if(message.utf8Data === 'video') {
                clearInterval(interval1);
                interval2 = setInterval(() => {
                    const frame = videoReader.read();
                    if(!frame.empty) {
                        const image = cv2.imencode('.jpg', frame).toString('base64');
                        connection.send(image);
                    } else {
                        videoReader.release();
                        videoReader.reset();
                        clearInterval(interval2);
                    }
                }, 1000 / FPS);
            }
        }
    });

    
    connection.on('close', function(reasonCode, description) {
        clearInterval(interval1);
        clearInterval(interval2);
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});

