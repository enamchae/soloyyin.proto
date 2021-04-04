
import {BinarySolo} from "./Soloyyin.js";
import ExtremaAnalyser from "./volume-calc/ExtremaAnalyser.js";

const video = document.querySelector("video");

/* const canvas = document.querySelector("canvas");
const canvasContext = canvas.getContext("2d");

canvas.height = 120;

const drawTimeDomain = analyserBuffer => {
	canvasContext.save();
	canvasContext.resetTransform();
	canvasContext.clearRect(0, 0, canvas.width, canvas.height);
	canvasContext.restore();

	analyserBuffer.forEach((sample, i) => {
		canvasContext.fillRect(i, 0, 1, sample);
	});
}; */

const dbDisplay = document.querySelector(".db");
const timeDriftDisplay = document.querySelector(".timedrift");

const THRESHOLD_AMP = ExtremaAnalyser.ampFromDbfs(-16);

const toggleButton = document.querySelector("#toggle");

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

			// drawTimeDomain(soloyyin.extremaAnalyser.analyserBuffer);
		},
	});

/* 	soloyyin.lookaheadMedia.controls = true;
	video.insertAdjacentElement("afterend", soloyyin.lookaheadMedia); */

/* 	canvas.width = soloyyin.extremaAnalyser.analyserBuffer.length;
	canvasContext.scale(1, -canvas.height / 2);
	canvasContext.translate(0, -1);
	canvasContext.fillStyle = "#aaa"; */

	const initToggleButton = () => {
		assignToggleButtonEvents();

		toggleButton.disabled = false;
		toggleButton.textContent = "▶ Start tracking";
	};

	const assignToggleButtonEvents = () => {
		toggleButton.addEventListener("click", async () => {
			toggleButton.disabled = true;
			toggleButton.textContent = "❚❚ Stop tracking";

			const stop = await soloyyin.start();

			toggleButton.addEventListener("click", () => {
				initToggleButton();
				stop();
			}, {once: true});
			
			toggleButton.disabled = false;
		}, {once: true});
	};
	
	initToggleButton();
})();