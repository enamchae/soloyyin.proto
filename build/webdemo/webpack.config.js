import webpack from "webpack";
import path from "path";
import consts from "../webpack.config-consts.js";

const plugins = [
	new webpack.DefinePlugin({
		"globalThis.WEBPACK__IS_WEB_EXT": JSON.stringify(false),	
	}),
];

export default [{
	...consts,
	plugins,

	entry: {
		index: "./webdemo/js/index.js",
	},
	output: {
		filename: "[name].js",
		path: path.resolve("./.webdemo-dist/js/"),
	},
}, {
	...consts,
	plugins,

	entry: {
		worklet: "./lib/volume-calc/Extremizer-audioworklet.js",
	},
	output: {
		filename: "Extremizer-audioworklet.js",
		path: path.resolve("./.webdemo-dist/js/"),
	},
}];