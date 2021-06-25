/**
 * @file (This file is meant to be processed with Webpack and will not work alone.)
 */

import browser from "webextension-polyfill";

export default (async () => {
	const tab = (await browser.tabs.query({active: true, currentWindow: true}))[0];
	console.log(tab);

	/**
	 * @namespace
	 */
	const Content = {
		message(messageType, messageOptions=null) {
			return browser.tabs.sendMessage(tab.id, {
				type: messageType,
				options: messageOptions,
			});
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

		async loadIfUnloaded() {
			if (await this.isLoaded()) {
				console.log("Content script already loaded");
			} else {
				console.log("Content script now loading");
				await browser.tabs.executeScript({file: "/content.js"});
				console.log("Content script done loading!");
			}
		},

		promptPickNewMedia() {
			return this.message("pick-new-media");
		},

		getEngineOptions() {
			return this.message("get-options");
		},

		setEngineOptions(optionsSource) {
			return this.message("set-options", optionsSource);
		},
	};

	browser.tabs.onUpdated.addListener((tabId, change) => {
		// Could teardown here if `change.status === "loading"`

		if (tabId !== tab.id || change.status !== "complete") return;
		location.reload();
	});
	
	await Content.loadIfUnloaded();

	return {tab, Content};
})();