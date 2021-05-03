/**
 * @file (This file is meant to be processed with Webpack and will not work alone.)
 */

import browser from "webextension-polyfill";

(async () => {
	const tab = (await browser.tabs.query({active: true, currentWindow: true}))[0];
	console.log(tab);

	/**
	 * @namespace
	 */
	const Content = {
		message(message) {
			return browser.tabs.sendMessage(tab.id, message);
		},

		async isLoaded() {
			// is there a better way to do this
			try {
				await this.message("noop");
				return true;
			} catch (error) {
				return false;
			}
		},

		promptPickNewMedia() {
			return this.message("pick-new-media");
		},
	};

	browser.tabs.onUpdated.addListener((tabId, change) => {
		// Could teardown here if `change.status === "loading"`

		if (tabId !== tab.id || change.status !== "complete") return;
		location.reload();
	});
	
	const loadContentScriptIfUnloaded = async () => {
		if (await Content.isLoaded()) {
			console.log("Content script already loaded");
		} else {
			console.log("Content script now loading");
			await browser.tabs.executeScript({file: "/content.js"});
			console.log("Content script done loading!");
		}
	};
	
	await loadContentScriptIfUnloaded();

	document.querySelector("#pick-new-media").addEventListener("click", async () => {
		console.log("Picking new media");

		await Content.promptPickNewMedia();
		console.log("New media selected");

		Content.message("start");
	});
})();