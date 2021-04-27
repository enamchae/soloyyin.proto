export default Object.freeze({
	MessageAction: Object.freeze({
		pollExtrema: "pollExtrema",
		invalidateSampleHistory: "invalidateSampleHistory",
	}),

	processorName: "extremizer",

	audioWorkletFilePath: "./js/Extremizer-audioworklet.js",
});