import browser from "webextension-polyfill";

browser.browserAction.onClicked.addListener(tab => {
	console.log("abc");
});