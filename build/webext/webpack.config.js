import path from "path";

export default [{
	mode: "production",

	entry: {
		content: "./webext/content.js",
	},
	output: {
		filename: "[name].js",
		path: path.resolve("./.webext-dist/"),
	}
}, {
	mode: "production",

	entry: {
		index: "./webext/popup/index.js",
	},
	output: {
		filename: "[name].js",
		path: path.resolve("./.webext-dist/popup/"),
	}
}, {
	mode: "production",

	entry: {
		worklet: "./webext/js/.lib/volume-calc/Extremizer-audioworklet.js",
	},
	output: {
		filename: "Extremizer-audioworklet.js",
		path: path.resolve("./.webext-dist/js/"),
	}
}];