import ExtremizerConsts from "./Extremizer-consts.js";

/**
 * Stores an `AudioContext` meant to process a media element's audio for its recent sample extrema.
 */
export default class ExtremaAnalyser {
	media;

	audioContext;

	analyser;
	analyserBuffer;

	extremizer = null;

	readyPromise;
	constructor(media, {
		sampleRate=44100, // Very low sample rates may lag at high speeds
		fftSize=1024,
		historyDuration,
		sampleStepSize=16,
	}={}) {
		this.media = media;

		this.audioContext = new AudioContext({sampleRate});
		const audioSrc = new MediaElementAudioSourceNode(this.audioContext, {mediaElement: media});
	
		this.analyser = new AnalyserNode(this.audioContext, {fftSize});
		this.analyserBuffer = new Float32Array(this.analyser.fftSize);

		this.readyPromise = ExtremizerNode.addToContext(this.audioContext)
				.then(() => {
					this.extremizer = new ExtremizerNode(this.audioContext, {
						sampleRate,
						historyDuration,
						sampleStepSize,
					});
				
					audioSrc.connect(this.analyser).connect(this.extremizer);
				});

		this.suspend();
	}

	untilReady() {
		return this.readyPromise;
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

	invalidateSampleHistory() {
		return this.extremizer.invalidateSampleHistory();
	}

	resumePromise = Promise.resolve();
	suspendPromise = Promise.resolve();

	async resume() {
		await this.suspendPromise;

		if (this.audioContext.state !== "suspended") return;
		this.resumePromise = this.audioContext.resume()
				.finally(() => {
					this.resumePromise = Promise.resolve();
				});
	}

	async suspend() {
		await this.resumePromise;

		if (this.audioContext.state !== "running") return;
		this.suspendPromise = this.audioContext.suspend()
				.finally(() => {
					this.suspendPromise = Promise.resolve();
				});
	}
}

/**
 * Destination node that provides an interface for `ExtremizerProcessor`.
 */
class ExtremizerNode extends AudioWorkletNode {
	constructor(audioContext, processorOptions) {
		super(audioContext, ExtremizerConsts.processorName, {
			processorOptions,
		});

		this.port.start();
	}

	static addToContext(audioContext) {
		return audioContext.audioWorklet.addModule(ExtremizerConsts.audioWorkletFilePath)
				.catch(console.log);
	}

	pollExtrema() {
		return new Promise(resolve => {
			const handler = event => {
				if (event.data.messageAction !== ExtremizerConsts.MessageAction.pollExtrema) return;

				this.port.removeEventListener("message", handler);
				resolve(event.data.data);
			};

			this.port.addEventListener("message", handler);
			this.port.postMessage(ExtremizerConsts.MessageAction.pollExtrema);
		});
	}

	invalidateSampleHistory() {
		return new Promise(resolve => {
			const handler = event => {
				if (event.data.messageAction !== ExtremizerConsts.MessageAction.invalidateSampleHistory) return;
				
				this.port.removeEventListener("message", handler);
				resolve();
			};

			this.port.addEventListener("message", handler);
			this.port.postMessage(ExtremizerConsts.MessageAction.invalidateSampleHistory);
		});
	}
}