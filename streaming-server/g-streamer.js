var express = require('express')
var http = require('http')
var net = require('net');
var child = require('child_process');
require('log-timestamp');   //adds timestamp in console.log()
const cors = require('cors');

var app = express();
app.use(express.static(__dirname + '/'));

var httpServer = http.createServer(app);
const port = 9001;  //change port number is required

var gstMuxer;

app.use(cors());

//send the html page which holds the video tag
app.get('/', function (req, res) {
    res.send('index.html');
});
//send the video stream
app.get('/stream', function (req, res) {

    res.writeHead(200, {
        'Content-Type': 'video/webm',
    });

    var tcpServer = net.createServer(function (socket) {
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
    });
});

//stop the connection
app.get('/stop', function (req, res) {
    console.log('Connection closed using /stop endpoint.');

    if (gstMuxer !== undefined) {
        gstMuxer.kill();    //killing GStreamer Pipeline
        console.log(`After gstkill in connection`);
    }
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
    var args =
        ['-e', '--gst-debug-level=2', '-v', 'mfvideosrc', 'device-name="Integrated Webcam"',
            '!', 'video/x-raw,framerate=30/1,width=1280,height=720',
            '!', 'x264enc', 'tune=zerolatency', 'bitrate=500', 'speed-preset=superfast',
            '!', 'queue', 'max-size-buffers=1', 'leaky=downstream',
            '!', 'mp4mux', 'fragment-duration=10', 'streamable=true',
            '!', 'tcpclientsink', 'sync=false', 'async=false', 'host=localhost',
            'port=' + tcpServer.address().port];
    return args;
}