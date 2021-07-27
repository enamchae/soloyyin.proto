/** @file (Webpack) */

import browser from "webextension-polyfill";

browser.browserAction.onClicked.addListener(async tab => {
	console.log("hi");
	await browser.tabs.executeScript(tab.id, {file: "/content/index.js"});
});