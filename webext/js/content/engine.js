import {TailSolo} from "@lib/Soloyyin.js";
import ExtremaAnalyser from "@lib/volume-calc/ExtremaAnalyser.js";

const NOOP = () => {};

export default class EngineManager {
	engine = null;
	options = {
		thresholdAmp: ExtremaAnalyser.ampFromDbfs(-16),
		loudSpeed: 1,
		softSpeed: 4,
	};
	data = {
		mediaSelected: false,
		selectingMedia: false,
		active: false,
		lastMaxAmp: NaN,
		lastIsLoud: false,
	};

	stopEngine = NOOP;
	
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
			
					if (this.data.lastIsLoud) {
						media.playbackRate = this.options.loudSpeed;
					} else {
						media.playbackRate = this.options.softSpeed;
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
		console.log("Starting engine");
		this.stopEngine = await this.engine.start();
		this.data.active = true;
	}

	stop() {
		console.log("Stopping engine");
		this.stopEngine();
		this.data.active = false;
	}

	toggle() {
		return this.data.active
				? this.stop()
				: this.start();
	}
}