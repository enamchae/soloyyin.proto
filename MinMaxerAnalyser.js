export default class MinMaxerAnalyser {
	media;

	audioContext;

	analyser;
	analyserBuffer;

	minMaxer;

	static async new(media, {
		sampleRate=44100, // Very low sample rates may lag at high speeds
		fftSize=1024,
		historyDuration,
		sampleStepSize=16,
	}={}) {
		const audioContext = new AudioContext({sampleRate});
		const audioSrc = new MediaElementAudioSourceNode(audioContext, {mediaElement: media});
	
		const analyser = new AnalyserNode(audioContext, {fftSize});
	
		await MinMaxerNode.registerWorkletModule(audioContext);
		const minMaxer = new MinMaxerNode(audioContext, {
			sampleRate,
			historyDuration,
			sampleStepSize,
		});
	
		audioSrc.connect(analyser).connect(minMaxer);

		return Object.assign(new MinMaxerAnalyser(), {
			media,
			audioContext,
			analyser,
			analyserBuffer: new Float32Array(analyser.fftSize),
			minMaxer,
		});
	}

	static dbfsFromAmp(amp) {
		return 20 * Math.log10(amp);
	}

	static ampFromDbfs(dbfs) {
		return 10 ** (dbfs / 20);
	}

	maxAmpFromExtrema(sampleMin, sampleMax) {
		return (sampleMax - sampleMin) / 2 / this.media.volume;
	}

	maxAmpFromAnalyser() {
		this.analyser.getFloatTimeDomainData(this.analyserBuffer);
		return this.maxAmpFromExtrema(Math.min(...this.analyserBuffer), Math.max(...this.analyserBuffer));
	}

	async maxAmpFromMinMaxer() {
		const {sampleMin, sampleMax} = await this.minMaxer.pollExtrema();
		return this.maxAmpFromExtrema(sampleMin, sampleMax);
	}
}

class MinMaxerNode extends AudioWorkletNode {
	constructor(audioContext, processorOptions) {
		super(audioContext, "min-maxer", {
			processorOptions,
		});

		this.port.start();
	}

	static registerWorkletModule(audioContext) {
		return audioContext.audioWorklet.addModule("MinMaxer-audio-worklet.js");
	}

	pollExtrema() {
		return new Promise(resolve => {
			this.port.addEventListener("message", event => {
				resolve(event.data);
			}, {once: true});

			this.port.postMessage(null);
		});
	}
}