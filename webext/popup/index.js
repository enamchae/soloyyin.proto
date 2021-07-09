/** @file (Webpack) */

import Vue from "vue";
import Root from "./Root.vue";

Vue.config.ignoredElements = [/.*/]; // Don't warn about custom elements

const app = new Vue({
	el: "main",
	render: createElement => createElement(Root),
});