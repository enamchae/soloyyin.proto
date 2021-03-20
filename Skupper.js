import Animloop from "./Animloop.js";
import Synchronizer from "./Synchronizer.js";

const createLookaheadVideo = video => {
	const lookaheadVideo = document.createElement("video");
	lookaheadVideo.src = video.src;
	lookaheadVideo.preload = true;
	return lookaheadVideo;
};

const createAnalyserAudioContext = (analysedVideo, sampleRate=44100, fftSize=2048) => {
	const audioContext = new AudioContext({sampleRate});
	const audioSrc = new MediaElementAudioSourceNode(audioContext, {mediaElement: analysedVideo});
	const analyser = new AnalyserNode(audioContext, {fftSize});

	audioSrc.connect(analyser);

	return {
		audioContext,
		analyser,
	};
};

export default class Skupper {
	video;
	lookaheadVideo;

	lookbehindMargin;
	lookaheadMargin;
	
	synchronizer;

	audioContext;
	analyser;
	analyserBuffer;

	animloop;

	constructor(video, {
		lookbehindMargin,
		lookaheadMargin,

		onAnimationFrame,
	}={}) {
		this.video = video;

		this.lookbehindMargin = lookbehindMargin;
		this.lookaheadMargin = lookaheadMargin;


		this.lookaheadVideo = createLookaheadVideo(video);
		this.synchronizer = new Synchronizer(video, this.lookaheadVideo, lookaheadMargin);


		const {audioContext, analyser} = createAnalyserAudioContext(this.lookaheadVideo);

		this.audioContext = audioContext;
		this.analyser = analyser;
		this.analyserBuffer = new Float32Array(analyser.fftSize);


		this.animloop = new Animloop(onAnimationFrame);
		this.attachEvents(this.lookaheadVideo);
	}

	static dbfsFromAmp(amp) {
		return 20 * Math.log10(amp);
	}

	static ampFromDbfs(dbfs) {
		return 10 ** (dbfs / 20);
	}

	maxAmpFromExtrema(sampleMin, sampleMax) {
		return (sampleMax - sampleMin) / 2 / this.lookaheadVideo.volume;
	}

	maxAmpFromAnalyser() {
		this.analyser.getFloatTimeDomainData(this.analyserBuffer);
		return this.maxAmpFromExtrema(Math.min(...this.analyserBuffer), Math.max(...this.analyserBuffer));
	}

	attachEvents(analysedVideo) {
		const logEvent = event => console.log(event.type);

		// analysedVideo.addEventListener("canplay", logEvent);
		// analysedVideo.addEventListener("loadeddata", logEvent);
		// analysedVideo.addEventListener("play", logEvent);
		analysedVideo.addEventListener("stalled", logEvent); 

		const onstart = event => {
			// logEvent(event);
	
			if (this.audioContext.state === "suspended") {
				this.audioContext.resume();
			}
	
			this.animloop.start();
		};

		const onstop = event => {
			// logEvent(event);

			if (this.audioContext.state === "running") {
				this.audioContext.suspend();
			}

			this.animloop.stop();
		};
	
		// The `playing` event fires when the media truly begins or resumes playing, and 
		// `pause` and `waiting` fire when the media truly stops playing.

		analysedVideo.addEventListener("playing", onstart);
	
		analysedVideo.addEventListener("pause", onstop);
		analysedVideo.addEventListener("waiting", onstop);
	}
}