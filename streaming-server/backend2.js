const express = require("express");
const fs = require("fs");
const ffmpeg = require("./ffmpeg");
const cors = require('cors');
const bodyParser = require('body-parser');
const findRemoveSync = require('find-remove');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use('/stream', express.static(__dirname));
app.use('/', express.static(__dirname + '/HLS/'));

 
const PORT = process.env.PORT || 5000;
const STREAMING_ARTIFACTS_PATH = './streaming-server';

app.get("/video", (req, res) => {
  const range = req.headers.range;
  const videoPath = "./assets/Media1.mp4";
  const videoSize = fs.statSync(videoPath).size;
 
  const chunkSize = 1 * 1e6;
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + chunkSize, videoSize - 1);
 
  const contentLength = end - start + 1;
 
  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mkv",
  };
  res.writeHead(206, headers);
 
  const stream = fs.createReadStream(videoPath, { start, end });
  stream.pipe(res);
});

app.get("/live", (req, res) => {
    ffmpeg.devicesList((devices) => {
      res.json(devices);
    });
});

app.post("/live", (req, res) => {
  ffmpeg.camera = req.body.videoSource
  ffmpeg.audio = req.body.audioSource
  res.send("Done");
});

app.get("/stopStream", (req, res) => {
  ffmpeg.stopStream();
  res.send("Done");
});

app.get("/stream/:streamFile", (req, res) => {
  var filePath = STREAMING_ARTIFACTS_PATH + req.params.streamFile +".m3u8";
  console.log(filePath);
  // File remover
  setInterval(() => {
    console.log("removed files are : ", findRemoveSync(STREAMING_ARTIFACTS_PATH + '/HLS/', { age: { seconds: 30 }, extensions: '.ts' }));
  }, 5000);
  //Read and send back
  fs.readFile(filePath, function (error, content) {
    res.writeHead(200, { 'Access-Control-Allow-Origin': '*' });
    if (error) {
      console.log("error");
        if (error.code === 'ENOENT') {
            fs.readFile('./404.html', function (error, content) {
              res.end(content, 'utf-8');
            });
        }
        else {
          res.writeHead(500);
          res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
          res.end();
        }
    }
    else {
      res.end(content, 'utf-8');
    }
  });
})


app.get("/index.m3u8", (req, res) => {
  console.log("heyoo");
  if(ffmpeg.camera !== "" && ffmpeg.audio !== "") {
    ffmpeg.streamVideo();
  }
  res.send("Done");
});

app.listen(PORT, () => console.log(`Streaming server is launched under port ${PORT}`));