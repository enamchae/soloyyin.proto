import ExtremizerConsts from "./Extremizer-consts.js";
import RollingF32Array from "./RollingArray.js";

const takeStep = function* (iterable, step=1) {
	let i = 0;
	for (const value of iterable) {
		if (i % step === 0) {
			yield value;
		}

		i++;
	}
};

/**
 * Rolling array with methods for calculating extrema.
 */
// Separation of concerns
class ExtremizerRollingArray extends RollingF32Array {
	lastPolledIndex = -1;

	sampleMin = NaN;
	sampleMinAbsIndex = -1;

	sampleMax = NaN;
	sampleMaxAbsIndex = -1;

	// unoptimized
	computeExtrema() {
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

/**
 * Destination processor which records the latest incoming sample history to compute its extrema.
 */
class ExtremizerProcessor extends AudioWorkletProcessor {
	sampleHistory;
	sampleHistoryLength;
	sampleStepSize;
	// nChannels = -1;

	constructor(workletNodeOptions) {
		workletNodeOptions.numberOfInputs = 1;
		workletNodeOptions.numberOfOutputs = 0;
		super(workletNodeOptions);

		const {sampleRate, historyDuration, sampleStepSize} = workletNodeOptions.processorOptions;

		// Length might be inaccurate (sample skipping is done on individual processing chunks)
		this.sampleHistoryLength = Math.ceil((sampleRate * historyDuration) / sampleStepSize);
		this.sampleStepSize = sampleStepSize;
		
		this.sampleHistory = new ExtremizerRollingArray(this.sampleHistoryLength);

		this.port.onmessage = event => {
			const messageAction = event.data;
			let data = null;
			switch (messageAction) {
				case ExtremizerConsts.MessageAction.pollExtrema:
					data = this.sampleHistory.computeExtrema() ?? {sampleMin: NaN, sampleMax: NaN};
					break;

				case ExtremizerConsts.MessageAction.invalidateSampleHistory:
					this.sampleHistory.resetPushload();
					break;

				default:
					throw new TypeError(`unknown action: ${messageAction}`);
			}

			this.port.postMessage({
				data,
				messageAction,
			});
		};
	}

/* 	get sampleHistoryUnready() {
		return this.sampleHistory === null;
	}

	initSampleHistory() {
		this.sampleHistory = new ExtremizerRollingArray(this.sampleHistoryLength);
	} */

	pushToSampleHistory(inputChannels) {
		// temp [0]
		this.sampleHistory.push(...takeStep(inputChannels[0], this.sampleStepSize));
/* 		inputChannels.forEach((channelSamples, i) => {
			this.sampleHistory[i].push(...takeStep(channelSamples, this.sampleStepSize));
		}); */
	}

	process(inputs, outputs, parameters) {
 		// const outputChannels = outputs[0];
		const inputChannels = inputs[0];

/* 		if (this.sampleHistoryUnready) {
			this.initSampleHistory();
		} */
		this.pushToSampleHistory(inputChannels);
		// this.nChannels = inputChannels.length;

/* 		outputChannels.forEach((outputChannel, i) => {
			const inputChannel = inputChannels[i];

			Object.assign(outputChannel, inputChannel);
		}); */

		return true;
	}
}

registerProcessor(ExtremizerConsts.processorName, ExtremizerProcessor);