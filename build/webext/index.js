import fse from "fs-extra";
import path from "path";
import webpack from "webpack";
import webpackConfig from "./webpack.config.js";

fse.emptyDirSync(path.resolve("./.webext-dist/"));

fse.copy(path.resolve("./webext/static/"), path.resolve("./.webext-dist/"));
webpack(webpackConfig, (error, stats) => {});