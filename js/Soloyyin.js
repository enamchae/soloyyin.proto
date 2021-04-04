import {AnimLoop, TimeoutLoop} from "./util/Looper.js";
import {TwinSync} from "./media-sync/Synchronizer.js";
import Medi from "./media-sync/Medi.js";
import ExtremaAnalyser from "./volume-calc/ExtremaAnalyser.js";

const createLookaheadMedia = media => {
	const lookaheadMedia = document.createElement("video");
	lookaheadMedia.src = media.currentSrc;
	lookaheadMedia.preload = true;
	return lookaheadMedia;
};

export default class Soloyyin {
	media;

	lookbehindMargin;
	lookaheadMargin;

	lookaheadMedia;
	synchronizer;

	extremaAnalyser;

	dbLoop;
	animLoop;

	constructor(media, {
		lookbehindMargin,
		lookaheadMargin,

		onIteration,
		onAnimationFrame,
	}={}) {
		this.media = media;

		this.lookbehindMargin = lookbehindMargin;
		this.lookaheadMargin = lookaheadMargin;

		this.lookaheadMedia = createLookaheadMedia(media);
		this.synchronizer = new TwinSync(media, this.lookaheadMedia, lookaheadMargin);

		this.extremaAnalyser = new ExtremaAnalyser(this.lookaheadMedia, {
			historyDuration: this.lookbehindMargin + this.lookaheadMargin,
		});

		this.dbLoop = new TimeoutLoop(onIteration);
		this.animLoop = new AnimLoop(onAnimationFrame);
	}

	async start() {
		await Promise.all([
			this.extremaAnalyser.untilReady(),
			this.synchronizer.onReload(),
		]);

		const unsync = this.synchronizer.sync();

		const lookaheadMedi = this.synchronizer.targetMedi;

		let stopperListener;
		const listeners = [
			lookaheadMedi.on(Medi.PLAYBACK_START, event => {
				this.extremaAnalyser.resume();
		
				this.dbLoop.start();
				this.animLoop.start();
			}),
		
			stopperListener = lookaheadMedi.on(Medi.PLAYBACK_STOP, event => {
				this.extremaAnalyser.suspend();
	
				this.dbLoop.stop();
				this.animLoop.stop();
			}),
		
			// This could also listen for `seeking`
			lookaheadMedi.on(Medi.LOAD_BEGIN, event => {
				this.extremaAnalyser.invalidateSampleHistory();
			}),
		];

		return () => {
			for (const listener of listeners) {
				listener.detach();
			}

			stopperListener.handler();
			unsync();
			lookaheadMedi.pause();
		};
	}
}

export class BinarySolo extends Soloyyin {
	thresholdAmp;

	softSpeed;
	loudSpeed;

	cachedMaxAmp;

	constructor(media, {
		thresholdAmp,

		softSpeed,
		loudSpeed,

		...options
	}={}) {
		super(media, {
			...options,

			onIteration: async () => {
				const maxAmp = this.cachedMaxAmp = await this.extremaAnalyser.maxAmpFromExtremizer();

				if (maxAmp < this.thresholdAmp) {
					this.media.playbackRate = this.softSpeed;
				} else {
					this.media.playbackRate = this.loudSpeed;
				}
			},
		});

		this.thresholdAmp = thresholdAmp;
		this.softSpeed = softSpeed;
		this.loudSpeed = loudSpeed;
	}
}