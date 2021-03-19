import Animloop from "./Animloop.js";

const TIME_DRIFT_CORRECTION_SPEED_FACTOR = 1.25;
const MAX_ACCEPTABLE_TIME_DRIFT = 0.02; // s
const MAX_CORRECTABLE_TIME_DRIFT = 0.5; // s

const MIN_SPEED = 1 / 16;
const MAX_SPEED = 16;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export default class Synchronizer {
	controllerVideo;
	targetVideo;

	offsetTime;
	offsetRateFactor = 1;

	// TODO very long constructor

	constructor(controllerVideo, targetVideo, offsetTime=0) {
		this.controllerVideo = controllerVideo;
		this.targetVideo = targetVideo;

		this.offsetTime = offsetTime;

		this.resyncTime();
		this.resyncRate();

		// TODO `play` and `pause` calls may sometimes interrupt each other (when setting too quickly?)

		const controllerOnplaying = async () => {
			controllerVideo.removeEventListener("playing", controllerOnplaying);

			if (targetVideo.paused) {
				await targetVideo.play();
			}

			controllerVideo.addEventListener("playing", controllerOnplaying);
		};

		const controllerOnpause = async () => {
			controllerVideo.removeEventListener("playing", controllerOnplaying);

			if (!targetVideo.paused) {
				targetVideo.pause();
			}
			this.resyncTime();

			controllerVideo.addEventListener("playing", controllerOnplaying);
		};

		const ignoreEventsAndPitstopResyncTime = async () => {
			controllerVideo.removeEventListener("playing", controllerOnplaying);
			controllerVideo.removeEventListener("pause", controllerOnpause);
			controllerVideo.removeEventListener("waiting", ignoreEventsAndPitstopResyncTime);
			targetVideo.removeEventListener("waiting", ignoreEventsAndPitstopResyncTime);

			await this.pitstopResyncTime();

			controllerVideo.addEventListener("playing", controllerOnplaying);
			controllerVideo.addEventListener("pause", controllerOnpause);
			controllerVideo.addEventListener("waiting", ignoreEventsAndPitstopResyncTime);
			targetVideo.addEventListener("waiting", ignoreEventsAndPitstopResyncTime);
		};

		controllerVideo.addEventListener("playing", controllerOnplaying);
		controllerVideo.addEventListener("pause", controllerOnpause);

		controllerVideo.addEventListener("waiting", ignoreEventsAndPitstopResyncTime);

		targetVideo.addEventListener("waiting", ignoreEventsAndPitstopResyncTime);

		controllerVideo.addEventListener("seeked", () => {
			this.resyncTime();
		});

		controllerVideo.addEventListener("ratechange", () => {
			this.resyncRate();
		});

		const animloop = new Animloop(async now => {
			const targetVideoTimeDrift = this.targetVideoTimeDrift();

			// TODO inconsistent. Current settings may cause target media to overshoot by next iteration.
			// Changing playback rate to many different values can cause slowdown.

			// Edge condition (near end of video, when 1 video ends) is handled by the target video firing `pause`
			// when ending.

			// console.log(targetVideoTimeDrift);

			if (Math.abs(targetVideoTimeDrift) > MAX_CORRECTABLE_TIME_DRIFT) {
				await ignoreEventsAndPitstopResyncTime();
				return;
			}

			if (targetVideoTimeDrift < -MAX_ACCEPTABLE_TIME_DRIFT) {
				this.offsetRateFactor = TIME_DRIFT_CORRECTION_SPEED_FACTOR;
			} else if (targetVideoTimeDrift > MAX_ACCEPTABLE_TIME_DRIFT) {
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

	async pitstopResyncTime() {
		this.controllerVideo.pause();
		this.targetVideo.pause();

		this.resyncTime();

		await Promise.all([
			this.controllerVideo.play(),
			this.targetVideo.play(),
		]);
	}

	targetVideoTimeDrift() {
		return this.targetVideo.currentTime - this.controllerVideo.currentTime - this.offsetTime;
	}
}