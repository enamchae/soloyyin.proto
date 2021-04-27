import {BinarySolo} from "./js/.lib/Soloyyin.js";
import ExtremaAnalyser from "./js/.lib/volume-calc/ExtremaAnalyser.js";

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

(async () => {
	browser.runtime.onMessage.addListener(async (message, sender) => {
		switch (message) {
			case "pick-new-media": {
				const media = await userPickNewMedia();
				console.log(media);

				const solo = new BinarySolo(media, {
					lookaheadMargin: 0.25,
					lookbehindMargin: 0.25,
					thresholdAmp: ExtremaAnalyser.ampFromDbfs(-16),
					loudSpeed: 1,
					softSpeed: 4,
				});

				break;
			}
				
			default:
				throw new TypeError();
		}
	});
})();