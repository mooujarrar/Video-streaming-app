const express = require("express");
const fs = require("fs");
const ffmpeg = require("./ffmpeg");
const cors = require('cors');
var bodyParser = require('body-parser');

const app = express();

app.use(cors());
app.use(bodyParser.json());

 
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/index.html")
})
 
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
  ffmpeg.streamVideo(() => {
    console.log("Done");
  });
});

app.listen(PORT, () => console.log(`Streaming server is launched under port ${PORT}`));