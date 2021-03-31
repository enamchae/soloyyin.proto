import {Animloop, Timeoutloop} from "./Looper.js";
import Synchronizer from "./Synchronizer.js";
import Medi from "./Medi.js";
import MinMaxerAnalyser from "./MinMaxerAnalyser.js";

const createLookaheadMedia = media => {
	const lookaheadMedia = document.createElement("video");
	lookaheadMedia.src = media.currentSrc;
	lookaheadMedia.preload = true;
	return lookaheadMedia;
};

export default class Skupper {
	media;

	lookaheadMedia;
	synchronizer;

	minMaxerAnalyser;

	static async new(media, {
		lookbehindMargin,
		lookaheadMargin,

		onIteration,
		onAnimationFrame,
	}={}) {
		const lookaheadMedia = createLookaheadMedia(media);
		const synchronizer = new Synchronizer(media, lookaheadMedia, lookaheadMargin);

		const minMaxerAnalyser = await MinMaxerAnalyser.new(lookaheadMedia, {
			historyDuration: lookbehindMargin + lookaheadMargin,
		});

		const dbLoop = new Timeoutloop(onIteration);
		const animloop = new Animloop(onAnimationFrame);
		
		const targetMedi = synchronizer.targetMedi;
		targetMedi.on(Medi.PLAYBACK_START, event => {
			if (minMaxerAnalyser.audioContext.state === "suspended") {
				minMaxerAnalyser.audioContext.resume();
			}
	
			dbLoop.start();
			animloop.start();
		});
	
		targetMedi.on(Medi.PLAYBACK_STOP, event => {
			if (minMaxerAnalyser.audioContext.state === "running") {
				minMaxerAnalyser.audioContext.suspend();
			}

			dbLoop.stop();
			animloop.stop();
		});

		return Object.assign(new Skupper(), {
			media,
			lookaheadMedia,
			synchronizer,
			minMaxerAnalyser,
		});
	}
}