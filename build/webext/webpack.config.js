import path from "path";
import consts from "../webpack.config-consts.js";

export default [{
	...consts,

	entry: {
		content: "./webext/js/content.js",
	},
	output: {
		filename: "[name].js",
		path: path.resolve("./.webext-dist/"),
	}
}, {
	...consts,

	entry: {
		index: "./webext/js/popup/index.js",
	},
	output: {
		filename: "[name].js",
		path: path.resolve("./.webext-dist/popup/"),
	}
}, {
	...consts,

	entry: {
		worklet: "./lib/volume-calc/Extremizer-audioworklet.js",
	},
	output: {
		filename: "Extremizer-audioworklet.js",
		path: path.resolve("./.webext-dist/js/"),
	}
}];