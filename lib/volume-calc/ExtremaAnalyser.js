import ExtremizerConsts from "./Extremizer-consts.js";

/* const captureAudioStream = media => {
	const stream = media.captureStream();
	for (const track of stream.getTracks()) {
		if (track.kind !== "audio") {
			stream.removeTrack(track);
		}
	}
	return stream;
}; */

/**
 * Stores an `AudioContext` meant to process a media element's audio for its recent sample extrema.
 */
export default class ExtremaAnalyser {
	media;
	usesStream;
	// mediaStream;

	audioContext;

	analyser;
	analyserBuffer;

	extremizer = null;

	connectAnalyser;
	connectDestination;

	readyPromise;
	constructor(media, {
		sampleRate=44100, // Very low sample rates may lag at high speeds
		fftSize=1024,
		historyDuration,
		sampleStepSize=16,
		captureMediaStream=false,
		connectAnalyser=true,
		connectDestination=false,
	}={}) {
		this.media = media;
		this.usesStream = captureMediaStream;
/* 		if (captureMediaStream) {
			this.mediaStream = media.captureStream();
		} */

		this.connectAnalyser = connectAnalyser;
		this.connectDestination = connectDestination;

		this.audioContext = new AudioContext({sampleRate});
		const audioSrc = this.createAudioSrcNodeFromMedia(media);
	
		this.analyser = new AnalyserNode(this.audioContext, {fftSize});
		this.analyserBuffer = new Float32Array(this.analyser.fftSize);

/* 		const streamActivePromise = new Promise(resolve => {
			if (!this.usesStream || this.mediaStream.active) {
				resolve();
				return;
			}

			this.mediaStream.addEventListener("active", () => resolve(), {once: true});
		}); */

		const workletLoadedPromise = ExtremizerNode.addToContext(this.audioContext)
				.then(() => {
					this.extremizer = new ExtremizerNode(this.audioContext, {
						sampleRate,
						historyDuration,
						sampleStepSize,
					});

					this.reconnectAudioNodes(audioSrc);
				});

		// this.readyPromise = Promise.all([streamActivePromise, workletLoadedPromise]);
		this.readyPromise = workletLoadedPromise;

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

	get mediaVolumeFactor() {
		return this.usesStream
				? 1
				: this.media.volume;
	}

	setMedia(media) {
		this.media = media;
		const audioSrc = this.createAudioSrcNodeFromMedia(media);
		this.reconnectAudioNodes(audioSrc);
	}

	createAudioSrcNodeFromMedia(media) {
		return this.usesStream
				// ? new MediaStreamAudioSourceNode(this.audioContext, {mediaStream: this.mediaStream})
				? new MediaStreamAudioSourceNode(this.audioContext, {mediaStream: media.captureStream()})
				: new MediaElementAudioSourceNode(this.audioContext, {mediaElement: media});
	}

	reconnectAudioNodes(audioSrc) {
		let latestNode = audioSrc;
		if (this.connectAnalyser) {
			latestNode = latestNode.connect(this.analyser);
		}

		latestNode = latestNode.connect(this.extremizer);
		if (this.connectDestination) {
			latestNode.connect(this.audioContext.destination);
		}
	}

	maxAmpFromExtrema(sampleMin, sampleMax) {
		return (sampleMax - sampleMin) / 2 / this.mediaVolumeFactor;
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