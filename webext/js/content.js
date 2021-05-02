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
	});
};

let currentSolo = null;

(async () => {
 	// No async listener: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage#parameters
	browser.runtime.onMessage.addListener((message, sender) => {
		switch (message) {
			case "ping":
				return Promise.resolve();

			case "pick-new-media":
				return (async () => {
					const media = await userPickNewMedia();
					console.log(media);

					currentSolo = new BinarySolo(media, {
						lookaheadMargin: 0.25,
						lookbehindMargin: 0.25,
						thresholdAmp: ExtremaAnalyser.ampFromDbfs(-16),
						loudSpeed: 1,
						softSpeed: 4,
					});

					return currentSolo;
				})();

			case "get-solo":
				return Promise.resolve(currentSolo);
				
			default:
				throw new TypeError();
		}
	});
})();