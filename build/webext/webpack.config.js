import webpack from "webpack";
import path from "path";
import consts from "../webpack.config-consts.js";

const plugins = [
	new webpack.DefinePlugin({
		"globalThis.WEBPACK__IS_WEB_EXT": JSON.stringify(true),	
	}),
];

export default [{
	...consts,
	plugins,

	entry: {
		content: "./webext/js/content.js",
	},
	output: {
		filename: "[name].js",
		path: path.resolve("./.webext-dist/"),
	}
}, {
	...consts,
	plugins,

	entry: {
		index: "./webext/js/popup/index.js",
	},
	output: {
		filename: "[name].js",
		path: path.resolve("./.webext-dist/popup/"),
	}
}, {
	...consts,
	plugins,

	entry: {
		worklet: "./lib/volume-calc/Extremizer-audioworklet.js",
	},
	output: {
		filename: "Extremizer-audioworklet.js",
		path: path.resolve("./.webext-dist/js/"),
	}
}];