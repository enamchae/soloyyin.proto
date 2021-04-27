import path from "path";

const mode = "production";
const devtool = process.env.NODE_ENV === "development" ? "source-map" : false;

export default [{
	mode,
	devtool,

	entry: {
		content: "./webext/js/content.js",
	},
	output: {
		filename: "[name].js",
		path: path.resolve("./.webext-dist/"),
	}
}, {
	mode,
	devtool,

	entry: {
		index: "./webext/js/popup/index.js",
	},
	output: {
		filename: "[name].js",
		path: path.resolve("./.webext-dist/popup/"),
	}
}, {
	mode,
	devtool,

	entry: {
		worklet: "./webext/js/.lib/volume-calc/Extremizer-audioworklet.js",
	},
	output: {
		filename: "Extremizer-audioworklet.js",
		path: path.resolve("./.webext-dist/js/"),
	}
}];