const spawn = require('child_process').spawn;
const exec = require('child_process').exec;

const ffmpeg = {

	camera: "",
	audio: "",

    //Make sure to set the camera and audio target devices prior to calling this function. See
    //devicesList() to get the device strings you'll need.
    //Why exec over spawn? Normally I'd prefer spawn, but for some reason the 
    //process never dies under spawn and it refuses to listen to kill messages
    //Also note that time, t, is in seconds, NOT MILLISECONDS.
    //The camera takes a bit to turn on, and there's extra time after the recording to "process"
    //the video, so take that into account
	record: function(opts, cb){
		if(typeof opts == "function"){
			cb = opts;
			opts = {};
		} else if(typeof opts == "string"){
			opts = { output: opts };
		} else if(typeof opts == "number"){
			opts = { duration: opts };
		}
		
		if(!opts.duration) opts.duration = 5;
		if(!opts.output) opts.output = "out.mkv";
		console.log('ffmpeg -t ' + opts.duration + '-f dshow  -i video="' + this.camera + '":audio="' + this.audio + '" ' + opts.output);
		var ffmpegRecord = exec('ffmpeg -t ' + opts.duration + ' -f dshow -video_size 1280x720 -rtbufsize 702000k -i video="' + this.camera + '":audio="' + this.audio + '" ' + opts.output);
		
		// ffmpegRecord.stdout.on("data", data =>{
		// 	console.log(">> ", data.toString());
		// });

		// ffmpegRecord.stderr.on("data", data =>{
		// 	console.log("@@ ", data.toString());
		// });

		ffmpegRecord.on("close", code =>{
			if(cb) cb();
		});
	},

    //This returns an object with video and audio devices (there may be overlap)
    //Use the device names returned exactly in the command above to trigger recording
	devicesList: function(cb){
		var ffmpegDevices = spawn("ffmpeg", ["-list_devices", "true", "-f", "dshow", "-i", "dummy"]);

		var result = "";

		ffmpegDevices.stdout.on("data", data =>{
			result += data.toString();
		});

		ffmpegDevices.stderr.on("data", data =>{
			result += data.toString();
		});

		ffmpegDevices.on("close", code =>{
			//parse the response
			const devices = { video: [], audio: [] };
			var resultVideos = result.split("DirectShow video devices (some may be both video and audio devices)")[1].split("DirectShow audio devices")[0];
			var resultAudio = result.split("DirectShow audio devices")[1];

			resultVideos = resultVideos.split('\n');
			resultVideos.shift();
			var deviceLines = [];
			resultVideos.forEach((line, index)=>{
				if(index % 2 === 0) deviceLines.push(line);
			});

			//Get rid of last line.
			deviceLines.pop();

			//All the names are after a ']  "' and BEFORE a ' "\r'
			deviceLines.forEach((line, index)=>{
				devices.video.push(line.split(']  "')[1].split('"\r')[0]);
			});
			
			//Now audio devices
			resultAudio = resultAudio.split('\n');
			resultAudio.shift();

			deviceLines = [];
			resultAudio.forEach((line, index)=>{
				if(index % 2 === 0) deviceLines.push(line);
			});
			deviceLines.pop();

			deviceLines.forEach((line, index)=>{
				devices.audio.push(line.split(']  "')[1].split('"\r')[0]);
			});

			cb(devices);
		});
	},

    //This will add an overlay over the entirety of the video, assuming its the same size. The 0:0 is the position. The -c:a uses the audio from the video track.
	addOverlay: function(overlay, cb){
		var ffmpegOverlay = exec('ffmpeg -i out.mp4 -i ' + overlay + ' -filter_complex "[0:v][1:v] overlay=0:0\'" -pix_fmt yuv420p -c:a copy out-overlay.mp4');

		ffmpegOverlay.on("close", function(){
			if(cb) cb();
		});
	},

	streamVideo: function(cb){
		
		console.log('ffmpeg -f dshow -i video="' + this.camera + '":audio="' + this.audio + '" -profile:v high -pix_fmt yuvj420p -level:v 4.1 -preset ultrafast -tune zerolatency -vcodec libx264 -r 10 -b:v 512k -s 640x360 -acodec aac -ac 2 -ab 32k -ar 44100 -f mpegts -flush_packets 0 udp://192.168.1.4:5000?pkt_size=1316');
		var ffmpegStream = exec('ffmpeg -f dshow -i video="' + this.camera + '":audio="' + this.audio + '" -profile:v high -pix_fmt yuvj420p -level:v 4.1 -preset ultrafast -tune zerolatency -vcodec libx264 -r 10 -b:v 512k -s 640x360 -acodec aac -ac 2 -ab 32k -ar 44100 -f mpegts -flush_packets 0 http://localhost:5040?pkt_size=1316');
	

		ffmpegStream.on("close", code =>{
			if(cb) cb();
		});
	},

}

module.exports = ffmpeg;