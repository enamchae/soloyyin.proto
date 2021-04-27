import path from "path";
import consts from "../webpack.config-consts.js";

export default [{
	...consts,

	entry: {
		index: "./webdemo/js/index.js",
	},
	output: {
		filename: "[name].js",
		path: path.resolve("./.webdemo-dist/js/"),
	}
}, {
	...consts,

	entry: {
		worklet: "./lib/volume-calc/Extremizer-audioworklet.js",
	},
	output: {
		filename: "Extremizer-audioworklet.js",
		path: path.resolve("./.webdemo-dist/js/"),
	}
}];