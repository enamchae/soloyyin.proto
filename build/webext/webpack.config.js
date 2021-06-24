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
		index: "./webext/popup/vue.index.js",
	},
	output: {
		filename: "index.js",
		path: path.resolve("./.webext-dist/popup/"),
	},
}, {
	...consts,
	plugins,

	entry: {
		content: "./webext/js/content.js",
	},
	output: {
		filename: "[name].js",
		path: path.resolve("./.webext-dist/"),
	},
}, {
	...consts,
	plugins,

	entry: {
		index: "./webext/popup/index.js",
	},
	output: {
		filename: "[name].js",
		path: path.resolve("./.webext-dist/popup/"),
	},
}, {
	...consts,
	plugins,

	entry: {
		worklet: "./lib/volume-calc/Extremizer-audioworklet.js",
	},
	output: {
		filename: "Extremizer-audioworklet.js",
		path: path.resolve("./.webext-dist/js/"),
	},
}];