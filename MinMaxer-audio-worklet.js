import RollingF32Array from "./RollingArray.js";

// Separation of concerns
class MinMaxerRollingArray extends RollingF32Array {
	lastPolledIndex = -1;

	sampleMin = NaN;
	sampleMinAbsIndex = -1;

	sampleMax = NaN;
	sampleMaxAbsIndex = -1;

	// unoptimized
	computeMinMax() {
		const sampleMin = this.sampleMinAbsIndex === -1
				? Math.min(...this.pushloadValues())
				: this.sampleMin;
		const sampleMax = this.sampleMaxAbsIndex === -1
				? Math.max(...this.pushloadValues())
				: this.sampleMax;

		return {
			sampleMin,
			sampleMax,
		};
	}

/* 	pushItem(item) {
		if (this.startOffset === this.sampleMinAbsIndex) {
			this.sampleMin = -1;
			this.sampleMinAbsIndex = -1;
		}

		super.pushItem(item);
	} */
}

class MinMaxerProcessor extends AudioWorkletProcessor {
	// sampleHistoryQueue;

	sampleHistoryLength;
	/** @type MinMaxerRollingArray[] */
	sampleHistory = null;

	// latestInputs;

/* 	minMaxComputed = false;
	sampleMin = NaN;
	sampleMax = NaN; */

	constructor(workletNodeOptions) {
		super(workletNodeOptions);

		const {sampleRate, historyDuration} = workletNodeOptions.processorOptions;
		console.log(sampleRate, historyDuration);

		this.sampleHistoryLength = sampleRate * historyDuration;

		// this.sampleHistoryQueue = new RollingQueue(this.historyDuration * this.sampleRate);

		this.port.onmessage = event => {
/* 			if (!this.minMaxComputed) {
				this.computeMinMax();
			} */

			// TODO temp [0]
			const sampleExtremes = this.sampleHistory?.[0].computeMinMax() ?? {sampleMin: NaN, sampleMax: NaN};

			this.port.postMessage({
				...sampleExtremes,
				...event.data,
			});
		};
	}

	get sampleHistoryUnready() {
		return this.sampleHistory === null;
	}

	initSampleHistory(inputChannels) {
		this.sampleHistory = inputChannels.map(() => new MinMaxerRollingArray(this.sampleHistoryLength));
	}

	pushToSampleHistory(inputChannels) {
		inputChannels.forEach((channelSamples, i) => {
			this.sampleHistory[i].push(...channelSamples);
		});
	}

	process(inputs, outputs, parameters) {
/* 		this.latestInputs = inputs;
		this.uncacheMinMax(); */

 		const outputChannels = outputs[0];
		const inputChannels = inputs[0];

		if (this.sampleHistoryUnready) {
			this.initSampleHistory(inputChannels);
		}
		this.pushToSampleHistory(inputChannels);

		outputChannels.forEach((outputChannel, i) => {
			const inputChannel = inputChannels[i];

			Object.assign(outputChannel, inputChannel);
		});

		return true;
	}

/* 	uncacheMinMax() {
		if (this.minMaxComputed) {
			this.minMaxComputed = false;
			this.sampleMin = NaN;
			this.sampleMax = NaN;
		}
	}

	computeMinMax() {
		// Currently handles first channel only
		const inputChannel = this.latestInputs?.[0][0];

		if (inputChannel) {
			this.sampleMax = Math.max(...inputChannel);
			this.sampleMin = Math.min(...inputChannel);
		}
		this.minMaxComputed = true;
	} */
}

registerProcessor("min-maxer", MinMaxerProcessor);