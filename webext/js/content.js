import browser from "webextension-polyfill";
import {BinarySolo} from "@lib/Soloyyin.js";
import ExtremaAnalyser from "@lib/volume-calc/ExtremaAnalyser.js";

// const browser = require("webextension-polyfill");

const userPickNewMedia = () => {
	return new Promise(resolve => {
		const onclick = event => {
			const elements = document.elementsFromPoint(event.pageX, event.pageY);

			for (const element of elements) {
				if (!(element instanceof HTMLMediaElement)) continue;

				removeEventListener("click", onclick);

				resolve(element);
				break;
			}
		};

		addEventListener("click", onclick);
	})
};

let currentEngine = null;

(async () => {
 	// No async listener: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage#parameters
	browser.runtime.onMessage.addListener((message, sender) => {
		console.log(`New content script message: ${message}`);

		switch (message) {
			case "noop":
				return Promise.resolve();

			// TODO handle multiple clicks
			case "pick-new-media":
				return (async () => {
					console.log("Picking new media");
					const media = await userPickNewMedia();
					console.log(media, media.currentSrc);

					currentEngine = new BinarySolo(media, {
						lookaheadMargin: 0.25,
						lookbehindMargin: 0.25,
						thresholdAmp: ExtremaAnalyser.ampFromDbfs(-16),
						loudSpeed: 1,
						softSpeed: 4,
					});

					// document.body.insertAdjacentElement("afterbegin", currentEngine.lookaheadMedia);

					return currentEngine;
				})();

			case "start":
				console.log("Starting engine");
				return (async () => {
					await currentEngine?.start();
				})();
				
			default:
				throw new TypeError();
		}
	});
})();

console.log("Content script loaded");