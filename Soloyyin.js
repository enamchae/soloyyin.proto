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

	lookaheadMedia;
	synchronizer;

	extremaAnalyser;

	dbLoop;
	animLoop;

	static async construct(media, {
		lookbehindMargin,
		lookaheadMargin,

		onIteration,
		onAnimationFrame,
	}={}) {
		const lookaheadMedia = createLookaheadMedia(media);
		const synchronizer = new TwinSync(media, lookaheadMedia, lookaheadMargin);

		const extremaAnalyser = await ExtremaAnalyser.construct(lookaheadMedia, {
			historyDuration: lookbehindMargin + lookaheadMargin,
		});

		const dbLoop = new TimeoutLoop(onIteration);
		const animLoop = new AnimLoop(onAnimationFrame);

		return Object.assign(new Soloyyin(), {
			media,
			lookaheadMedia,
			synchronizer,
			extremaAnalyser,
			dbLoop,
			animLoop,
		});
	}

	async start() {
		await this.synchronizer.onReload();
		const unsync = this.synchronizer.sync();

		const lookaheadMedi = this.synchronizer.targetMedi;

		let stopperListener;
		const listeners = [
			lookaheadMedi.on(Medi.PLAYBACK_START, event => {
				if (this.extremaAnalyser.audioContext.state === "suspended") {
					this.extremaAnalyser.audioContext.resume();
				}
		
				this.dbLoop.start();
				this.animLoop.start();
			}),
		
			stopperListener = lookaheadMedi.on(Medi.PLAYBACK_STOP, event => {
				if (this.extremaAnalyser.audioContext.state === "running") {
					this.extremaAnalyser.audioContext.suspend();
				}
	
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