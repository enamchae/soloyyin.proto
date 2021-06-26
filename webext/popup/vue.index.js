/** @file (Webpack) */

import Vue from "vue";
import Root from "./Root.vue";

const app = new Vue({
	el: "main",
	render: createElement => createElement(Root),
});