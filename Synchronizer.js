import Animloop from "./Animloop.js";

const TIME_DRIFT_CORRECTION_SPEED_FACTOR = 1.25;
const MAX_ACCEPTABLE_TIME_DRIFT = 0.02; // s
const MAX_CORRECTABLE_TIME_DRIFT = 0.5; // s

const MIN_SPEED = 1 / 16;
const MAX_SPEED = 16;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const pauseMedia = async media => {
	// Awaiting `play` ensures that the `pause` call does not interrupt an in-progress `play` call
	// `play` will not have an effect on the current time[citation needed] unless the media has ended (in which case it will restart the media)
	if (!media.ended) {
		await media.play();
	}
	media.pause();
};

const playMedia = media => media.play();

export default class Synchronizer {
	controllerMedia;
	targetMedia;

	offsetTime;
	offsetRateFactor = 1;

	// TODO very long constructor

	constructor(controllerMedia, targetMedia, offsetTime=0) {
		this.controllerMedia = controllerMedia;
		this.targetMedia = targetMedia;

		this.offsetTime = offsetTime;

		this.resyncTime();
		this.resyncRate();

		// TODO target video will sometimes pause and not restart

		const controllerOnplaying = async () => {
			// console.log("!! controllerOnplaying");
			// console.time("!! controllerOnplaying");

			controllerMedia.removeEventListener("playing", controllerOnplaying);
			targetMedia.removeEventListener("waiting", ignoreEventsAndPitstopResyncTime);

			if (targetMedia.paused) {
				await playMedia(targetMedia);
			}
			
			controllerMedia.addEventListener("playing", controllerOnplaying);
			targetMedia.addEventListener("waiting", ignoreEventsAndPitstopResyncTime);

			// console.timeEnd("!! controllerOnplaying");
		};

		const controllerOnpause = async () => {
			// console.log("!! controllerOnpause");
			// console.time("!! controllerOnpause");

			controllerMedia.removeEventListener("playing", controllerOnplaying);
			targetMedia.removeEventListener("waiting", ignoreEventsAndPitstopResyncTime);

			if (!targetMedia.paused) {
				await pauseMedia(targetMedia);
			}
			this.resyncTime();

			controllerMedia.addEventListener("playing", controllerOnplaying);
			targetMedia.addEventListener("waiting", ignoreEventsAndPitstopResyncTime);

			// console.timeEnd("!! controllerOnpause");
		};

		const ignoreEventsAndPitstopResyncTime = async () => {
			// console.log("!! ignoreEventsAndPitstopResyncTime", event, new Error());
			// console.time("!! ignoreEventsAndPitstopResyncTime");

			// TODO user can still play while the media is being paused, which causes synchronizer to desync

			controllerMedia.removeEventListener("playing", controllerOnplaying);
			controllerMedia.removeEventListener("pause", controllerOnpause);
			controllerMedia.removeEventListener("waiting", ignoreEventsAndPitstopResyncTime);
			targetMedia.removeEventListener("waiting", ignoreEventsAndPitstopResyncTime);
			
			await this.pauseAllMedia();
			this.resyncTime();
			await this.playAllMedia();

			controllerMedia.addEventListener("playing", controllerOnplaying);
			controllerMedia.addEventListener("pause", controllerOnpause);
			controllerMedia.addEventListener("waiting", ignoreEventsAndPitstopResyncTime);
			targetMedia.addEventListener("waiting", ignoreEventsAndPitstopResyncTime);

			// console.timeEnd("!! ignoreEventsAndPitstopResyncTime");
		};

		controllerMedia.addEventListener("playing", controllerOnplaying);
		controllerMedia.addEventListener("pause", controllerOnpause);
		controllerMedia.addEventListener("waiting", ignoreEventsAndPitstopResyncTime);
		targetMedia.addEventListener("waiting", ignoreEventsAndPitstopResyncTime);

		controllerMedia.addEventListener("seeked", () => {
			this.resyncTime();
		});

		controllerMedia.addEventListener("ratechange", () => {
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
				await this.playAllMedia(); // Ensures that the media is playing by the time the next iteration is called
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

		targetMedia.addEventListener("playing", () => {
			animloop.start();
		});

		const targetAnimloopOnstop = () => {
			animloop.stop();
		};
		targetMedia.addEventListener("pause", targetAnimloopOnstop);
		targetMedia.addEventListener("waiting", targetAnimloopOnstop);
	}

	pauseAllMedia() {
		return Promise.all([
			pauseMedia(this.controllerMedia),
			pauseMedia(this.targetMedia),
		]);
	}

	playAllMedia() {
		return Promise.all([
			playMedia(this.controllerMedia),
			playMedia(this.targetMedia),
		]);
	}

	resyncTime() {
		this.targetMedia.currentTime = this.controllerMedia.currentTime + this.offsetTime;
	}

	resyncRate() {
		this.targetMedia.playbackRate = clamp(this.controllerMedia.playbackRate * this.offsetRateFactor, MIN_SPEED, MAX_SPEED);
	}

	targetVideoTimeDrift() {
		return this.targetMedia.currentTime - this.controllerMedia.currentTime - this.offsetTime;
	}
}