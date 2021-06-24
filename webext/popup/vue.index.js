/** @file (Webpack) */

import Vue from "vue";
import Main from "./Main.vue";

const app = new Vue({
	el: "main",
	render: createElement => createElement(Main),
});