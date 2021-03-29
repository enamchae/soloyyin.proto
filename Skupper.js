import {Animloop, Timeoutloop} from "./Looper.js";
import Synchronizer from "./Synchronizer.js";
import Medi from "./Medi.js";

const createLookaheadMedia = media => {
	const lookaheadMedia = document.createElement("video");
	lookaheadMedia.src = media.currentSrc;
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

	dbLoop;
	animloop;

	constructor(media, {
		lookbehindMargin,
		lookaheadMargin,

		onIteration,
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


		this.dbLoop = new Timeoutloop(onIteration);
		this.animloop = new Animloop(onAnimationFrame);
		this.attachEvents(this.synchronizer.targetMedi);
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

	attachEvents(analysedMedi) {
		analysedMedi.on(Medi.PLAYBACK_START, event => {
			if (this.audioContext.state === "suspended") {
				this.audioContext.resume();
			}
	
			this.dbLoop.start();
			this.animloop.start();
		});
	
		analysedMedi.on(Medi.PLAYBACK_STOP, event => {
			if (this.audioContext.state === "running") {
				this.audioContext.suspend();
			}

			this.dbLoop.stop();
			this.animloop.stop();
		});
	}
}