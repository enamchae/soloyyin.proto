import path from "path";

const mode = "production";
const devtool = process.env.NODE_ENV === "development" ? "source-map" : false;

export default [{
	mode,
	devtool,

	entry: {
		index: "./webdemo/js/index.js",
	},
	output: {
		filename: "[name].js",
		path: path.resolve("./.webdemo-dist/js/"),
	}
}, {
	mode,
	devtool,

	entry: {
		worklet: "./webdemo/js/.lib/volume-calc/Extremizer-audioworklet.js",
	},
	output: {
		filename: "Extremizer-audioworklet.js",
		path: path.resolve("./.webdemo-dist/js/"),
	}
}];