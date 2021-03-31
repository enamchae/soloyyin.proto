import RollingF32Array from "./RollingArray.js";

const takeStep = function* (iterable, step=1) {
	const generator = iterable[Symbol.iterator]();
	let i = 0;
	while (true) {
		const {done, value} = generator.next();
		if (done) break;

		if (i % step === 0) {
			yield value;
		}

		i++;
	}
};

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
	sampleHistoryLength;
	sampleStepSize;
	/** @type MinMaxerRollingArray[] */
	sampleHistory = null;

	constructor(workletNodeOptions) {
		workletNodeOptions.numberOfInputs = 1;
		workletNodeOptions.numberOfOutputs = 0;
		super(workletNodeOptions);

		const {sampleRate, historyDuration, sampleStepSize} = workletNodeOptions.processorOptions;

		// Length might be inaccurate (sample skipping is done on individual processing chunks)
		this.sampleHistoryLength = Math.ceil((sampleRate * historyDuration) / sampleStepSize);
		this.sampleStepSize = sampleStepSize;

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
			this.sampleHistory[i].push(...takeStep(channelSamples, this.sampleStepSize));
		});
	}

	process(inputs, outputs, parameters) {
 		// const outputChannels = outputs[0];
		const inputChannels = inputs[0];

		if (this.sampleHistoryUnready) {
			this.initSampleHistory(inputChannels);
		}
		this.pushToSampleHistory(inputChannels);

/* 		outputChannels.forEach((outputChannel, i) => {
			const inputChannel = inputChannels[i];

			Object.assign(outputChannel, inputChannel);
		}); */

		return true;
	}
}

registerProcessor("min-maxer", MinMaxerProcessor);