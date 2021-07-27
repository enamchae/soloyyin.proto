import browser from "webextension-polyfill";
import {TailSolo} from "@lib/Soloyyin.js";
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

const NOOP = () => {};

const createEngine = media => new TailSolo(media, {
	lookbehindMargin: 0.25,
	// lookaheadMargin: 0.25,
	// thresholdAmp: ExtremaAnalyser.ampFromDbfs(-16),
	// loudSpeed: 1,
	// softSpeed: 4,

	onIteration: async () => {
		const maxAmp = await currentEngine.extremaAnalyser.maxAmpFromExtremizer();
		engineData.lastMaxAmp = maxAmp;
		engineData.lastIsLoud = maxAmp >= engineOptions.thresholdAmp;

		if (maxAmp < engineOptions.thresholdAmp) {
			media.playbackRate = engineOptions.softSpeed;
		} else {
			media.playbackRate = engineOptions.loudSpeed;
		}
	},

	teardown: () => {
		media.playbackRate = 1;
	},
});

class EngineManager {
	engine = null;
	options;
	data;

	stop = NOOP;

	constructor() {
		this.options = {
			thresholdAmp: ExtremaAnalyser.ampFromDbfs(-16),
			loudSpeed: 1,
			softSpeed: 4,
		};

		this.data = {
			mediaSelected: false,
			selectingMedia: false,
			active: false,
			lastMaxAmp: NaN,
			lastIsLoud: false,
		};
	}

	setMedia(media) {
		if (!this.engine) {
			this.engine = new TailSolo(media, {
				lookbehindMargin: 0.25,
				// lookaheadMargin: 0.25,
				// thresholdAmp: ExtremaAnalyser.ampFromDbfs(-16),
				// loudSpeed: 1,
				// softSpeed: 4,
			
				onIteration: async () => {
					const maxAmp = await this.engine.extremaAnalyser.maxAmpFromExtremizer();
					this.data.lastMaxAmp = maxAmp;
					this.data.lastIsLoud = maxAmp >= this.options.thresholdAmp;
			
					if (maxAmp < engineOptions.thresholdAmp) {
						media.playbackRate = this.options.softSpeed;
					} else {
						media.playbackRate = this.options.loudSpeed;
					}
				},
			
				teardown: () => {
					media.playbackRate = 1;
				},
			});

		} else {
			this.engine.setMedia(media);
		}
	}

	async start() {
		this.stop = await this.engine.start();
		this.data.active = true;
	}
}

const engines = [

];

let currentEngine = null;
let stopCurrentEngine = NOOP;
const engineOptions = {
	thresholdAmp: ExtremaAnalyser.ampFromDbfs(-16),
	loudSpeed: 1,
	softSpeed: 4,
};

const engineData = {
	mediaSelected: false,
	selectingMedia: false,
	active: false,
	lastMaxAmp: NaN,
	lastIsLoud: false,
};

(async () => {
 	// No async listener: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage#parameters
	browser.runtime.onMessage.addListener((message, sender) => {
		// console.log(`New content script message (${message.type}):`, message);

		switch (message.type) {
			case "noop":
				return Promise.resolve();

			// TODO handle multiple clicks
			case "pick-new-media":
				if (engineData.selectingMedia) return Promise.resolve();

				engineData.selectingMedia = true;
				return (async () => {
					console.log("Picking new media");
					const media = await userPickNewMedia();
					console.log(media, media.currentSrc);

					if (!currentEngine) {
						currentEngine = createEngine(media);
					} else {
						currentEngine.setMedia(media);
					}

					engineData.mediaSelected = true;
					engineData.selectingMedia = false;

					// document.body.insertAdjacentElement("afterbegin", currentEngine.lookaheadMedia);

					return currentEngine;
				})();

			case "start":
				console.log("Starting engine");
				return (async () => {
					stopCurrentEngine = await currentEngine?.start();
					engineData.active = true;
				})();

			case "stop":
				console.log("Stopping engine");
				stopCurrentEngine();
				engineData.active = false;
				return Promise.resolve();

			case "get-options":
				return Promise.resolve(engineOptions);

			case "set-options":
				Object.assign(engineOptions, message.options);
				return Promise.resolve();

			case "get-data":
				return Promise.resolve(engineData);
				
			default:
				throw new TypeError();
		}
	});
})();

console.log("Content script loaded");