
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

const dbDisplay = document.querySelector("#db");
const timeDriftDisplay = document.querySelector("#timedrift");

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

//#region media upload
{
	const mediaInput = document.querySelector("#media-upload");

	let currentUrl = "";
	mediaInput.addEventListener("change", () => {
		const file = mediaInput.files[0];
		if (!file) return;

		if (currentUrl) {
			URL.revokeObjectURL(currentUrl);
		}

		currentUrl = URL.createObjectURL(file);
		video.src = currentUrl;

		mediaInput.value = "";
	});
}
//#endregion

//#region toggle button
{
	const toggleButton = document.querySelector("#toggle");

	const initToggleButton = () => {
		assignToggleButtonEvents();

		toggleButton.disabled = false;
		toggleButton.textContent = "▶ Start tracking";
		toggleButton.classList.remove("enabled");
	};
	const assignToggleButtonEvents = () => {
		toggleButton.addEventListener("click", async () => {
			toggleButton.disabled = true;
			toggleButton.textContent = "❚❚ Stop tracking";
			toggleButton.classList.add("enabled");

			const stop = await soloyyin.start();

			toggleButton.addEventListener("click", () => {
				initToggleButton();
				stop();
			}, {once: true});
			
			toggleButton.disabled = false;
		}, {once: true});
	};
	initToggleButton();
}
//#endregion

//#region param inputs
{
	const MAX_N_FRACTION_DIGITS = 4;
	const roundF32 = f32 => {
		return Number(f32.toFixed(MAX_N_FRACTION_DIGITS));
	};
	
	const createParamInputs = () => {
		const marginConverter = {
			validate(value) {
				return 0 <= value && value <= 3;
			},
		};
	
		const speedConverter = {
			toTextbox: roundF32,
			fromSlider(value) {
				return 2 ** value;
			},
			toSlider(value) {
				return Math.log2(value);
			},
			validate(value) {
				return 0.25 <= value && value <= 4;
			},
		};
	
		const paramConverters = new Map([
			["lookbehindMargin", marginConverter],
			["lookaheadMargin", marginConverter],
		
			["thresholdAmp", {
				fromTextbox: ExtremaAnalyser.ampFromDbfs,
				toTextbox(value) {
					return roundF32(ExtremaAnalyser.dbfsFromAmp(value));
				},
				validate(value) {
					return 0 <= value && value <= 1;
				},
			}],
		
			["loudSpeed", speedConverter],
			["softSpeed", speedConverter],
		]);
	
		const oldValues = new Map();
	
		const to = (type, paramName, value) =>
				(type === "range"
						? paramConverters.get(paramName).toSlider?.(value)
						: paramConverters.get(paramName).toTextbox?.(value))
				?? value;
	
		const from = (type, paramName, value) =>
				(type === "range"
						? paramConverters.get(paramName).fromSlider?.(value)
						: paramConverters.get(paramName).fromTextbox?.(value))
				?? value;
	
		const validate = (paramName, value) =>
				paramConverters.get(paramName).validate?.(value) ?? true;
	
		const update = (paramName, value, exceptInput=null) => {
			demoParams[paramName] = value;
			for (const input of document.querySelectorAll(`[data-param=${paramName}]`)) {
				if (input === exceptInput) continue;
				input.value = to(input.type, paramName, value);
			}
		};
	
		for (const input of document.querySelectorAll(".param")) {
			const paramName = input.getAttribute("data-param");
			const type = input.type;
	
			if (!oldValues.has(paramName)) {
				oldValues.set(paramName, demoParams[paramName]);
			}
	
			let validated = false;
			input.addEventListener("input", () => {
				const newValue = from(type, paramName, parseFloat(input.value));
	
				if (validate(paramName, newValue)) {
					update(paramName, newValue, input);
					validated = true;
					input.parentElement.classList.remove("error");
				} else {
					validated = false;
					input.parentElement.classList.add("error");
				}
			});
	
			input.addEventListener("change", () => {
				if (validated) {
					oldValues.set(paramName, demoParams[paramName]);
				}
				update(paramName, oldValues.get(paramName));
				input.parentElement.classList.remove("error");
				validated = false;
			});
	
			input.value = to(type, paramName, demoParams[paramName]);
		}
	};
	createParamInputs();
}
//#endregion