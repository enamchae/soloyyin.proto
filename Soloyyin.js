import {AnimLoop, TimeoutLoop} from "./Looper.js";
import {TwinSync} from "./Synchronizer.js";
import Medi from "./Medi.js";
import ExtremaAnalyser from "./ExtremaAnalyser.js";

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
		
		const lookaheadMedi = synchronizer.targetMedi;
		lookaheadMedi.on(Medi.PLAYBACK_START, event => {
			if (extremaAnalyser.audioContext.state === "suspended") {
				extremaAnalyser.audioContext.resume();
			}
	
			dbLoop.start();
			animLoop.start();
		});
	
		lookaheadMedi.on(Medi.PLAYBACK_STOP, event => {
			if (extremaAnalyser.audioContext.state === "running") {
				extremaAnalyser.audioContext.suspend();
			}

			dbLoop.stop();
			animLoop.stop();
		});
	
		lookaheadMedi.on(Medi.LOAD_BEGIN, event => {
			extremaAnalyser.invalidateSampleHistory();
		});

		return Object.assign(new Soloyyin(), {
			media,
			lookaheadMedia,
			synchronizer,
			extremaAnalyser,
		});
	}
}