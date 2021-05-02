const audioWorkletFilePathBase = "./js/Extremizer-audioworklet.js"; // relative to HTML page

export default Object.freeze({
	MessageAction: Object.freeze({
		pollExtrema: "pollExtrema",
		invalidateSampleHistory: "invalidateSampleHistory",
	}),

	processorName: "extremizer",

	// Uses a Webpack flag to determine whether this appears in a web extension or not.
	// (`globalThis.WEBPACK__IS_WEB_EXT` is defined in a DefinePlugin in the Webpack configs.
	// Not infallible since `WEBPACK__IS_WEB_EXT` can be defined on global scope)
	audioWorkletFilePath: globalThis.WEBPACK__IS_WEB_EXT
			// `browser` and `chrome` are from webext APIs, undefined in browser
			? (globalThis.browser?.runtime.getURL(audioWorkletFilePathBase)
					?? globalThis.chrome?.extension.getURL(audioWorkletFilePathBase))
			: audioWorkletFilePathBase,
});