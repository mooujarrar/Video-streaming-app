var express = require('express')
var http = require('http')
var net = require('net');
var child = require('child_process');
require('log-timestamp');   //adds timestamp in console.log()
const cors = require('cors');
//const { Server } = require("socket.io");
const datagram = require("dgram");
const NodeMediaServer = require('node-media-server');

var app = express();
app.use(express.static(__dirname + '/'));

var httpServer = http.createServer(app);
const port = 9001;  //change port number is required

var gstMuxer;
var udpServer;

app.use(cors());

/*const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
});*/

const config = {
    rtmp: {
      port: 1935,
      chunk_size: 60000,
      gop_cache: true,
      ping: 30,
      ping_timeout: 60
    },
    http: {
      port: 4000,
      allow_origin: '*'
    }
  };
  
  var nms = new NodeMediaServer(config)
  nms.run();

//send the html page which holds the video tag
app.get('/', function (req, res) {
    res.send('index.html');
});
//send the video stream
app.get('/stream', function (req, res) {

    res.writeHead(200, {
        'Content-Type': 'video/webm',
    });

    if(udpServer === undefined) {
        udpServer = datagram.createSocket("udp4");
        udpServer.bind({
            address: 'localhost',
            port: 9001,
            exclusive: true
        });
    }

    udpServer.on('message', function (data) {
        res.write(data);
    });

    /*io.on('connection', (socket) => {
        console.log("Websocket Connection started.");
        //listen incomming messages
        udpServer.on('message', function (data) {
            socket.emit('data', data);
        });
    });*/

    udpServer.on('close', function (had_error) {
        console.log('Socket closed.');
        res.end();
    });

    udpServer.on('error', function (had_error) {
        console.log('error: ', had_error);
        res.end(had_error);
    });

    udpServer.on('listening', () => {
        console.log("Connection started.");
        if (gstMuxer === undefined) {
            console.log("inside gstMuxer == undefined");
            var cmd = 'gst-launch-1.0';
            var args = getGstPipelineArguments(udpServer);
            gstMuxer = child.spawn(cmd, args);
    
            gstMuxer.stderr.on('data', onSpawnError);
            gstMuxer.on('exit', onSpawnExit);
        }
        else {
            console.log("New GST pipeline rejected because gstMuxer != undefined.");
        }
    });


    /*var tcpServer = net.createServer(function (socket) {
        socket.on('data', function (data) {
            res.write(data);
        });
        socket.on('close', function (had_error) {
            console.log('Socket closed.');
            res.end();
        });
    });

    tcpServer.maxConnections = 3;

    tcpServer.listen(function () {
        console.log("Connection started.");
        if (gstMuxer === undefined) {
            console.log("inside gstMuxer == undefined");
            var cmd = 'gst-launch-1.0';
            var args = getGstPipelineArguments(this);
            gstMuxer = child.spawn(cmd, args);

            gstMuxer.stderr.on('data', onSpawnError);
            gstMuxer.on('exit', onSpawnExit);
        }
        else {
            console.log("New GST pipeline rejected because gstMuxer != undefined.");
        }
    });*/
});

//stop the connection
app.get('/stop', function (req, res) {
    console.log('Connection closed using /stop endpoint.');

    if (gstMuxer !== undefined) {
        gstMuxer.kill();    //killing GStreamer Pipeline
        console.log(`After gstkill in connection`);
    }

    if (udpServer !== undefined) {
        udpServer.close();
    }
    udpServer = undefined;
    gstMuxer = undefined;

    res.end();
});


httpServer.listen(port);
console.log(`Camera Stream App listening at http://localhost:${port}`)

process.on('uncaughtException', function (err) {
    console.log(err);
});

//functions
function onSpawnError(data) {
    console.log(data.toString());
}

function onSpawnExit(code) {
    if (code != null) {
        console.log('GStreamer error, exit code ' + code);
    }
}

function getGstPipelineArguments(tcpServer) {
    //Replace 'videotestsrc', 'pattern=ball' with camera source in below GStreamer pipeline arguments.
    //Note: Every argument should be written in single quotes as done below*
    //var args = ['autovideosrc', '!', 'autovideosink'];
    // tcpclientsink
    var args =
        ['-e', '--gst-debug-level=2', '-v', 'mfvideosrc', 'device-name="Integrated Webcam"',
            '!', 'video/x-raw,width=1280,height=720,framerate=30/1',
            '!', 'x264enc', 'tune=zerolatency', 'bitrate=500', 'speed-preset=superfast',
            '!', 'queue', 'max-size-buffers=1', 'max-size-time=0', 'max-size-bytes=0' ,'min-threshold-time=60000000000',
            '!', 'mp4mux', 'fragment-duration=10', 'streamable=true',
            '!', 'udpsink', 'sync=false', 'async=false', 'host=localhost',
            'port=' + tcpServer.address().port];

    /*args = ['-e', '--gst-debug-level=2', '-v', 'mfvideosrc', 'device-name="Integrated Webcam"', 
    '!', 'rtmpsink', 'sync=false', 'location="rtmp://localhost/live/stream"'];*/
    return args;
}