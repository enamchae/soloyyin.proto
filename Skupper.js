import Animloop from "./Animloop.js";
import Synchronizer from "./Synchronizer.js";

const createLookaheadMedia = media => {
	const lookaheadMedia = document.createElement("video");
	lookaheadMedia.src = media.src;
	lookaheadMedia.preload = true;
	return lookaheadMedia;
};

const createAnalyserAudioContext = (analysedVideo, sampleRate=44100, fftSize=1024) => {
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
	media;
	lookaheadMedia;

	lookbehindMargin;
	lookaheadMargin;
	
	synchronizer;

	audioContext;
	analyser;
	analyserBuffer;

	animloop;

	constructor(media, {
		lookbehindMargin,
		lookaheadMargin,

		onAnimationFrame,
	}={}) {
		this.media = media;

		this.lookbehindMargin = lookbehindMargin;
		this.lookaheadMargin = lookaheadMargin;


		this.lookaheadMedia = createLookaheadMedia(media);
		this.synchronizer = new Synchronizer(media, this.lookaheadMedia, lookaheadMargin);


		const {audioContext, analyser} = createAnalyserAudioContext(this.lookaheadMedia);

		this.audioContext = audioContext;
		this.analyser = analyser;
		this.analyserBuffer = new Float32Array(analyser.fftSize);


		this.animloop = new Animloop(onAnimationFrame);
		this.attachEvents(this.lookaheadMedia);
	}

	static dbfsFromAmp(amp) {
		return 20 * Math.log10(amp);
	}

	static ampFromDbfs(dbfs) {
		return 10 ** (dbfs / 20);
	}

	maxAmpFromExtrema(sampleMin, sampleMax) {
		return (sampleMax - sampleMin) / 2 / this.lookaheadMedia.volume;
	}

	maxAmpFromAnalyser() {
		this.analyser.getFloatTimeDomainData(this.analyserBuffer);
		return this.maxAmpFromExtrema(Math.min(...this.analyserBuffer), Math.max(...this.analyserBuffer));
	}

	attachEvents(analysedMedia) {
		const logEvent = event => console.log(event.type);

		analysedMedia.addEventListener("canplay", logEvent);
		analysedMedia.addEventListener("loadeddata", logEvent);
		analysedMedia.addEventListener("play", logEvent);
		analysedMedia.addEventListener("stalled", logEvent); 

		const onstart = event => {
			logEvent(event);
	
			if (this.audioContext.state === "suspended") {
				this.audioContext.resume();
			}
	
			this.animloop.start();
		};

		const onstop = event => {
			logEvent(event);

			if (this.audioContext.state === "running") {
				this.audioContext.suspend();
			}

			this.animloop.stop();
		};
	
		// The `playing` event fires when the media truly begins or resumes playing, and 
		// `pause` and `waiting` fire when the media truly stops playing.

		analysedMedia.addEventListener("playing", onstart);
	
		analysedMedia.addEventListener("pause", onstop);
		analysedMedia.addEventListener("waiting", onstop);
	}
}