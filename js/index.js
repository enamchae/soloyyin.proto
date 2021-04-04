
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

const dbDisplay = document.querySelector("#db");
const timeDriftDisplay = document.querySelector("#timedrift");

const toggleButton = document.querySelector("#toggle");

const demoParams = {
	lookbehindMargin: 0.5,
	lookaheadMargin: 0.5,
	thresholdAmp: ExtremaAnalyser.ampFromDbfs(-16),
	loudSpeed: 1,
	softSpeed: 4,
};

const soloyyin = new BinarySolo(video, {
	thresholdAmp: demoParams.thresholdAmp,
	softSpeed: demoParams.softSpeed,
	loudSpeed: demoParams.loudSpeed,

	lookbehindMargin: demoParams.lookbehindMargin,
	lookaheadMargin: demoParams.lookaheadMargin,

	onAnimationFrame: () => {
		const maxDbfs = ExtremaAnalyser.dbfsFromAmp(soloyyin.lastMaxAmp);
		dbDisplay.textContent = maxDbfs;
		dbDisplay.classList.toggle("target", soloyyin.lastMaxAmp >= demoParams.thresholdAmp);

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


const createParamInputs = () => {
	const paramConverters = {
		lookbehindMargin: {
			validate(value) {
				return 0 <= value && value <= 3;
			},
		},
	
		lookaheadMargin: {
			validate(value) {
				return 0 <= value && value <= 3;
			},
		},
	
		thresholdAmp: {
			fromTextbox(value) {
				return ExtremaAnalyser.ampFromDbfs(value);
			},
	
			toTextbox(value) {
				return ExtremaAnalyser.dbfsFromAmp(value);
			},
	
			validate(value) {
				return 0 <= value && value <= 1;
			},
		},
	
		loudSpeed: {
			fromSlider(value) {
				return 2 ** value;
			},
	
			toSlider(value) {
				return Math.log2(value);
			},
	
			validate(value) {
				return 0.125 <= value && value <= 8;
			},
		},
		
		softSpeed: {
			fromSlider(value) {
				return 2 ** value;
			},
	
			toSlider(value) {
				return Math.log2(value);
			},
	
			validate(value) {
				return 0.125 <= value && value <= 8;
			},
		},
	};

	for (const input of document.querySelectorAll(".param")) {
		const paramName = input.getAttribute("data-param");
		const type = input.type;

		// let oldValue;
		// input.addEventListener("input", () => {
		// });

		if (type === "range") {
			input.value = paramConverters[paramName].toSlider?.(demoParams[paramName]) ?? demoParams[paramName];
		} else {
			input.value = paramConverters[paramName].toTextbox?.(demoParams[paramName]) ?? demoParams[paramName];
		}
	}
};
createParamInputs();

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