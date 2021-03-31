import {AnimLoop, TimeoutLoop} from "./Looper.js";
import Synchronizer from "./Synchronizer.js";
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

	static async new(media, {
		lookbehindMargin,
		lookaheadMargin,

		onIteration,
		onAnimationFrame,
	}={}) {
		const lookaheadMedia = createLookaheadMedia(media);
		const synchronizer = new Synchronizer(media, lookaheadMedia, lookaheadMargin);

		const extremaAnalyser = await ExtremaAnalyser.new(lookaheadMedia, {
			historyDuration: lookbehindMargin + lookaheadMargin,
		});

		const dbLoop = new TimeoutLoop(onIteration);
		const animloop = new AnimLoop(onAnimationFrame);
		
		const targetMedi = synchronizer.targetMedi;
		targetMedi.on(Medi.PLAYBACK_START, event => {
			if (extremaAnalyser.audioContext.state === "suspended") {
				extremaAnalyser.audioContext.resume();
			}
	
			dbLoop.start();
			animloop.start();
		});
	
		targetMedi.on(Medi.PLAYBACK_STOP, event => {
			if (extremaAnalyser.audioContext.state === "running") {
				extremaAnalyser.audioContext.suspend();
			}

			dbLoop.stop();
			animloop.stop();
		});

		return Object.assign(new Soloyyin(), {
			media,
			lookaheadMedia,
			synchronizer,
			extremaAnalyser,
		});
	}
}