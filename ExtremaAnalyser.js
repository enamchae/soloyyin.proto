export default class ExtremaAnalyser {
	media;

	audioContext;

	analyser;
	analyserBuffer;

	extremizer;

	static async construct(media, {
		sampleRate=44100, // Very low sample rates may lag at high speeds
		fftSize=1024,
		historyDuration,
		sampleStepSize=16,
	}={}) {
		const audioContext = new AudioContext({sampleRate});
		const audioSrc = new MediaElementAudioSourceNode(audioContext, {mediaElement: media});
	
		await ExtremizerNode.addToContext(audioContext);
		const analyser = new AnalyserNode(audioContext, {fftSize});

		const extremizer = new ExtremizerNode(audioContext, {
			sampleRate,
			historyDuration,
			sampleStepSize,
		});
	
		audioSrc.connect(analyser).connect(extremizer);

		return Object.assign(new ExtremaAnalyser(), {
			media,
			audioContext,
			analyser,
			analyserBuffer: new Float32Array(analyser.fftSize),
			extremizer,
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

	async maxAmpFromExtremizer() {
		const {sampleMin, sampleMax} = await this.extremizer.pollExtrema();
		return this.maxAmpFromExtrema(sampleMin, sampleMax);
	}
}

class ExtremizerNode extends AudioWorkletNode {
	constructor(audioContext, processorOptions) {
		super(audioContext, "extremizer", {
			processorOptions,
		});

		this.port.start();
	}

	static addToContext(audioContext) {
		return audioContext.audioWorklet.addModule("Extremizer-audioworklet.js");
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