/** @file (Webpack) */

import browser from "webextension-polyfill";
import Vue from "vue";
import Root from "./Root.vue";

const mountContainer = document.createElement("solo-container");
const mountShadow = mountContainer.attachShadow({mode: "closed"});
const mountTarget = document.createElement("main");

mountShadow.append(mountTarget);
document.documentElement.append(mountContainer);

Vue.config.ignoredElements = [/.*/]; // Vue to not warn about custom elements

const app = new Vue({
	el: mountTarget,
	render: createElement => createElement(Root),
});