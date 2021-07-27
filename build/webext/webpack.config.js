import webpack from "webpack";
import path from "path";
import {VueLoaderPlugin} from "vue-loader";
// import HtmlWebpackPlugin from "html-webpack-plugin";
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
		background: "./webext/js/background.js",
	},
	output: {
		path: path.resolve("./.webext-dist/"),
		filename: "[name].js",
	},
}, {
	...consts,
	plugins: plugins.concat(new VueLoaderPlugin(), /* new HtmlWebpackPlugin({
		template: "./webext/popup/index.html",
	}) */),

	module: {
		rules: [{
			test: /\.vue$/,
			loader: "vue-loader",
		}, {
			test: /\.css$/,
			use: [
				"vue-style-loader",
				"css-loader",
			],
		}],
	},

	entry: {
		index: "./webext/js/content/index.js",
	},
	output: {
		path: path.resolve("./.webext-dist/content/"),
		filename: "[name].js",
	},
}, {
	...consts,
	plugins,

	entry: {
		worklet: "./lib/volume-calc/Extremizer-audioworklet.js",
	},
	output: {
		path: path.resolve("./.webext-dist/js/"),
		filename: "Extremizer-audioworklet.js",
	},
}];