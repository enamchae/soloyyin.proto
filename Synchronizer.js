import Animloop from "./Animloop.js";

const TIME_DRIFT_CORRECTION_SPEED_FACTOR = 1.125;
const MAX_TIME_DRIFT = 0.02; // s

const MIN_SPEED = 1 / 16;
const MAX_SPEED = 16;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export default class Synchronizer {
	controllerVideo;
	targetVideo;

	offsetTime;
	offsetRateFactor = 1;

	constructor(controllerVideo, targetVideo, offsetTime=0) {
		this.controllerVideo = controllerVideo;
		this.targetVideo = targetVideo;

		this.offsetTime = offsetTime;

		this.resyncTime();
		this.resyncRate();

		// TODO `play` and `pause` calls may sometimes interrupt each other (when setting too quickly?)

		const controllerOnplaying = async event => {
			controllerVideo.removeEventListener("playing", controllerOnplaying);

			if (targetVideo.paused) {
				await targetVideo.play();
			}
			this.resyncTime();

			controllerVideo.addEventListener("playing", controllerOnplaying);
		};

		const controllerOnpause = async event => {
			controllerVideo.removeEventListener("playing", controllerOnplaying);

			if (!targetVideo.paused) {
				await targetVideo.pause();
			}
			this.resyncTime();

			controllerVideo.addEventListener("playing", controllerOnplaying);
		};

		const onwaiting = async event => {
			controllerVideo.removeEventListener("playing", controllerOnplaying);
			controllerVideo.removeEventListener("pause", controllerOnpause);
			controllerVideo.removeEventListener("waiting", onwaiting);
			targetVideo.removeEventListener("waiting", onwaiting);

			await Promise.all([
				controllerVideo.pause(),
				targetVideo.pause(),
			]);
			this.resyncTime();
			await Promise.all([
				controllerVideo.play(),
				targetVideo.play(),
			]);

			controllerVideo.addEventListener("playing", controllerOnplaying);
			controllerVideo.addEventListener("pause", controllerOnpause);
			controllerVideo.addEventListener("waiting", onwaiting);
			targetVideo.addEventListener("waiting", onwaiting);
		};

		controllerVideo.addEventListener("playing", controllerOnplaying);
		controllerVideo.addEventListener("pause", controllerOnpause);

		controllerVideo.addEventListener("waiting", onwaiting);

		targetVideo.addEventListener("waiting", onwaiting);

		controllerVideo.addEventListener("seeked", () => {
			this.resyncTime();
		});

		controllerVideo.addEventListener("ratechange", () => {
			this.resyncRate();
		});

		const animloop = new Animloop(now => {
			const targetVideoTimeDrift = this.targetVideoTimeDrift();

			// TODO inconsistent. Current settings may cause target media to overshoot by next `timeupdate`.
			// Changing playback rate to many different values can cause slowdown.

			// Edge condition (near end of video, when 1 video ends) is handled by the target video firing `pause`
			// when ending.

			// console.log(targetVideoTimeDrift);

			if (targetVideoTimeDrift < -MAX_TIME_DRIFT) {
				this.offsetRateFactor = TIME_DRIFT_CORRECTION_SPEED_FACTOR;
			} else if (targetVideoTimeDrift > MAX_TIME_DRIFT) {
				this.offsetRateFactor = 1 / TIME_DRIFT_CORRECTION_SPEED_FACTOR;
			} else {
				this.offsetRateFactor = 1;
			}

			this.resyncRate();
		});

		targetVideo.addEventListener("playing", () => {
			animloop.start();
		});

		const targetAnimloopOnstop = () => {
			animloop.stop();
		};
		targetVideo.addEventListener("pause", targetAnimloopOnstop);
		targetVideo.addEventListener("waiting", targetAnimloopOnstop);
	}

	resyncTime() {
		this.targetVideo.currentTime = this.controllerVideo.currentTime + this.offsetTime;
	}

	resyncRate() {
		this.targetVideo.playbackRate = clamp(this.controllerVideo.playbackRate * this.offsetRateFactor, MIN_SPEED, MAX_SPEED);
	}

	targetVideoTimeDrift() {
		return this.targetVideo.currentTime - this.controllerVideo.currentTime - this.offsetTime;
	}
}