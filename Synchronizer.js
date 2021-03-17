const TIME_DRIFT_CORRECTION_SPEED_FACTOR = 1.5;
const MAX_TIME_DRIFT = 0.01; // s

export default class Synchronizer {
	controllerVideo;
	targetVideo;

	offsetTime;

	animationFrameHandle = null;

	constructor(controllerVideo, targetVideo, offsetTime=0) {
		this.controllerVideo = controllerVideo;
		this.targetVideo = targetVideo;

		this.offsetTime = offsetTime;

		this.resyncTime();
		this.resyncRate();

		// TODO doesn't work

		const controllerOnplaying = async event => {
			controllerVideo.removeEventListener("playing", controllerOnplaying);

			if (targetVideo.paused) {
				await targetVideo.play();
			}
			this.resyncTime();

			controllerVideo.addEventListener("playing", controllerOnplaying);
		};

		const controllerOnpause = async event => {
			if (!targetVideo.paused) {
				await targetVideo.pause();
			}
			this.resyncTime();
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

		controllerVideo.addEventListener("timeupdate", () => {
			const targetVideoTimeDrift = targetVideo.currentTime - controllerVideo.currentTime - this.offsetTime;

			// TODO inconsistent. Current settings may cause target media to overshoot by next `timeupdate`.
			// Changing playback rate to many different values can cause slowdown.

			// TODO edge condition (when video is near end).
			// console.log(targetVideoTimeDrift);

			if (targetVideoTimeDrift < -MAX_TIME_DRIFT) {
				targetVideo.playbackRate = targetVideo.playbackRate * TIME_DRIFT_CORRECTION_SPEED_FACTOR;
			} else if (targetVideoTimeDrift > MAX_TIME_DRIFT) {
				targetVideo.playbackRate = targetVideo.playbackRate / TIME_DRIFT_CORRECTION_SPEED_FACTOR;
			} else {
				this.resyncRate();
			}
		});
	}

	resyncTime() {
		this.targetVideo.currentTime = this.controllerVideo.currentTime + this.offsetTime;
	}

	resyncRate() {
		this.targetVideo.playbackRate = this.controllerVideo.playbackRate;
	}
}