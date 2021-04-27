import path from "path";

export default [{
	mode: "production",

	entry: {
		index: "./webdemo/js/index.js",
	},
	output: {
		filename: "[name].js",
		path: path.resolve("./.webdemo-dist/js/"),
	}
}, {
	mode: "production",

	entry: {
		worklet: "./webdemo/js/.lib/volume-calc/Extremizer-audioworklet.js",
	},
	output: {
		filename: "Extremizer-audioworklet.js",
		path: path.resolve("./.webdemo-dist/js/"),
	}
}];