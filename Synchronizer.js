import Animloop from "./Animloop.js";

const TIME_DRIFT_CORRECTION_SPEED_FACTOR = 1.25;
const MAX_ACCEPTABLE_TIME_DRIFT = 0.02; // s
const MAX_CORRECTABLE_TIME_DRIFT = 0.5; // s

const MIN_SPEED = 1 / 16;
const MAX_SPEED = 16;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const pauseVideo = async video => {
	// Awaiting `play` ensures that the `pause` call does not interrupt an in-progress `play` call
	// `play` will not have an effect on the current video time unless the video has ended (in which case it will restart the video)[citation needed]
	if (!video.ended) {
		await video.play();
	}
	video.pause();
};

const playVideo = video => video.play();

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

		// TODO target video will sometimes pause and not restart

		const controllerOnplaying = async () => {
			controllerVideo.removeEventListener("playing", controllerOnplaying);
			targetVideo.removeEventListener("waiting", ignoreEventsAndPitstopResyncTime);

			if (targetVideo.paused) {
				await playVideo(targetVideo);
			}
			
			controllerVideo.addEventListener("playing", controllerOnplaying);
			targetVideo.addEventListener("waiting", ignoreEventsAndPitstopResyncTime);
		};

		const controllerOnpause = async () => {
			controllerVideo.removeEventListener("playing", controllerOnplaying);
			targetVideo.removeEventListener("waiting", ignoreEventsAndPitstopResyncTime);

			if (!targetVideo.paused) {
				await pauseVideo(targetVideo);
			}
			this.resyncTime();

			controllerVideo.addEventListener("playing", controllerOnplaying);
			targetVideo.addEventListener("waiting", ignoreEventsAndPitstopResyncTime);
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
		await Promise.all([
			pauseVideo(this.controllerVideo),
			pauseVideo(this.targetVideo),
		]);

		this.resyncTime();

		await Promise.all([
			playVideo(this.controllerVideo),
			playVideo(this.targetVideo),
		]);
	}

	targetVideoTimeDrift() {
		return this.targetVideo.currentTime - this.controllerVideo.currentTime - this.offsetTime;
	}
}