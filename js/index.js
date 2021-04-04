
import {BinarySolo} from "./Soloyyin.js";
import ExtremaAnalyser from "./volume-calc/ExtremaAnalyser.js";

const video = document.querySelector("video");

const canvas = document.querySelector("canvas");
const canvasContext = canvas.getContext("2d");

const drawTimeDomain = analyserBuffer => {
	canvasContext.save();
	canvasContext.resetTransform();
	canvasContext.clearRect(0, 0, canvas.width, canvas.height);
	canvasContext.restore();

	analyserBuffer.forEach((sample, i) => {
		canvasContext.fillRect(i, 0, 1, sample);
	});
};

const dbDisplay = document.querySelector(".db");
const timeDriftDisplay = document.querySelector(".timedrift");

const THRESHOLD_AMP = ExtremaAnalyser.ampFromDbfs(-16);

(async () => {
	const soloyyin = new BinarySolo(video, {
		thresholdAmp: THRESHOLD_AMP,
		softSpeed: 4,
		loudSpeed: 1,

		lookbehindMargin: 0.5,
		lookaheadMargin: 0.5,

		onAnimationFrame: () => {
			const maxDbfs = ExtremaAnalyser.dbfsFromAmp(soloyyin.cachedMaxAmp);
			dbDisplay.textContent = maxDbfs;
			dbDisplay.classList.toggle("target", soloyyin.cachedMaxAmp >= THRESHOLD_AMP);

			timeDriftDisplay.textContent = soloyyin.synchronizer.targetMediaTimeDrift().toFixed(6);

			drawTimeDomain(soloyyin.extremaAnalyser.analyserBuffer);
		},
	});

	const stop = await soloyyin.start();

/* 	soloyyin.lookaheadMedia.controls = true;
	video.insertAdjacentElement("afterend", soloyyin.lookaheadMedia); */

	canvas.width = soloyyin.extremaAnalyser.analyserBuffer.length;
	canvas.height = 120;
	canvasContext.scale(1, -canvas.height / 2);
	canvasContext.translate(0, -1);
	canvasContext.fillStyle = "#aaa";

/* 	const logEvent = event => console.log(`%c${event.type}`, "color: blue; font-weight: 700;");

	video.addEventListener("canplay", logEvent);
	video.addEventListener("loadeddata", logEvent);
	video.addEventListener("play", logEvent);
	video.addEventListener("stalled", logEvent);
	video.addEventListener("playing", logEvent);
	video.addEventListener("pause", logEvent);
	video.addEventListener("waiting", logEvent); 

	const logEvent2 = event => console.log(`%c${event.type}`, "color: green;");

	soloyyin.lookaheadMedia.addEventListener("canplay", logEvent2);
	soloyyin.lookaheadMedia.addEventListener("loadeddata", logEvent2);
	soloyyin.lookaheadMedia.addEventListener("play", logEvent2);
	soloyyin.lookaheadMedia.addEventListener("stalled", logEvent2);
	soloyyin.lookaheadMedia.addEventListener("playing", logEvent2);
	soloyyin.lookaheadMedia.addEventListener("pause", logEvent2);
	soloyyin.lookaheadMedia.addEventListener("waiting", logEvent2); */
})();