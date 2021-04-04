
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

const demoParams = (() => {
	const demoParams = {
		lookbehindMargin: 0.5,
		lookaheadMargin: 0.5,
		thresholdAmp: ExtremaAnalyser.ampFromDbfs(-16),
		loudSpeed: 1,
		softSpeed: 4,
	};

	return {
		get lookbehindMargin() { return demoParams.lookbehindMargin; },
		get lookaheadMargin() { return demoParams.lookaheadMargin; },
		get thresholdAmp() { return demoParams.thresholdAmp; },
		get loudSpeed() { return demoParams.loudSpeed; },
		get softSpeed() { return demoParams.softSpeed; },

		set lookbehindMargin(value) {
			throw new Error("not implemented");
			demoParams.lookbehindMargin = value;
		},
		set lookaheadMargin(value) {
			throw new Error("not implemented");
			demoParams.lookaheadMargin = value;
		},
		set thresholdAmp(value) {
			soloyyin.thresholdAmp = value;
			demoParams.thresholdAmp = value; 
		},
		set loudSpeed(value) {
			soloyyin.loudSpeed = value;
			demoParams.loudSpeed = value; 
		},
		set softSpeed(value) {
			soloyyin.softSpeed = value;
			demoParams.softSpeed = value;
		},
	};
})();

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

//#region toggle button
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
//#endregion

//#region param inputs
const createParamInputs = () => {
	const marginConverter = {
		validate(value) {
			return 0 <= value && value <= 3;
		},
	};

	const speedConverter = {
		fromSlider(value) {
			return 2 ** value;
		},
		toSlider(value) {
			return Math.log2(value);
		},
		validate(value) {
			return 0.125 <= value && value <= 8;
		},
	};

	const paramConverters = {
		lookbehindMargin: marginConverter,
		lookaheadMargin: marginConverter,
	
		thresholdAmp: {
			fromTextbox: ExtremaAnalyser.ampFromDbfs,
			toTextbox: ExtremaAnalyser.dbfsFromAmp,
			validate(value) {
				return 0 <= value && value <= 1;
			},
		},
	
		loudSpeed: speedConverter,
		softSpeed: speedConverter,
	};

	const to = (type, paramName, value) =>
			(type === "range"
					? paramConverters[paramName].toSlider?.(value)
					: paramConverters[paramName].toTextbox?.(value))
			?? value;

	const from = (type, paramName, value) =>
			(type === "range"
					? paramConverters[paramName].fromSlider?.(value)
					: paramConverters[paramName].fromTextbox?.(value))
			?? value;

	const validate = (paramName, value) =>
			paramConverters[paramName].validate?.(value) ?? true;

	for (const input of document.querySelectorAll(".param")) {
		const paramName = input.getAttribute("data-param");
		const type = input.type;

		let oldValue;
		let validated = false;
		input.addEventListener("input", () => {
			const newValue = from(type, paramName, parseFloat(input.value));

			if (validate(paramName, newValue)) {
				demoParams[paramName] = newValue;
				validated = true;
			} else {
				validated = false;
			}
		});

		input.addEventListener("change", () => {
			if (validated) {
				oldValue = demoParams[paramName];
			} else {
				input.value = oldValue;
				demoParams[paramName] = oldValue;
			}
			validated = false;
		});

		input.value = oldValue = to(type, paramName, demoParams[paramName]);
	}
};
createParamInputs();
//#endregion