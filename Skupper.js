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

	animationFrameHandle = null;

	onAnimationFrame;

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

		this.onAnimationFrame = onAnimationFrame;

		this.attachEvents(this.lookaheadVideo);
	}

	static dbFromAmp(amp) {
		return 20 * Math.log10(amp);
	}

	maxAmpFromExtrema(sampleMin, sampleMax) {
		return (sampleMax - sampleMin) / 2 / this.lookaheadVideo.volume;
	}

	maxAmpFromAnalyser() {
		this.analyser.getFloatTimeDomainData(this.analyserBuffer);
		return this.maxAmpFromExtrema(Math.min(...this.analyserBuffer), Math.max(...this.analyserBuffer));
	}

	attachEvents(analysedVideo) {
		const animationFrameCallback = now => {
			this.onAnimationFrame?.(now);

			if (this.animationFrameHandle === null) return;
			this.animationFrameHandle = requestAnimationFrame(animationFrameCallback);
		};

		const onstart = event => {
			console.log(event.type);
	
			if (this.audioContext.state === "suspended") {
				this.audioContext.resume();
			}
	
			if (this.animationFrameHandle !== null) return;
			this.animationFrameHandle = requestAnimationFrame(animationFrameCallback);
		};

		const onstop = event => {
			console.log(event.type);

			if (this.audioContext.state === "running") {
				this.audioContext.suspend();
			}

			cancelAnimationFrame(this.animationFrameHandle);
			this.animationFrameHandle = null;
		};

		const logEvent = event => console.log(event.type);

		analysedVideo.addEventListener("canplay", logEvent);
		analysedVideo.addEventListener("loadeddata", logEvent);
		analysedVideo.addEventListener("play", logEvent);
		analysedVideo.addEventListener("stalled", logEvent);
	
		analysedVideo.addEventListener("playing", onstart);
	
		analysedVideo.addEventListener("pause", onstop);
		analysedVideo.addEventListener("waiting", onstop);
	}
}