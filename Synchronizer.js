import Animloop from "./Animloop.js";
import Medi from "./Medi.js";

const TIME_DRIFT_CORRECTION_SPEED_FACTOR = 1.25;
const MAX_ACCEPTABLE_TIME_DRIFT = 0.02; // s
const MAX_CORRECTABLE_TIME_DRIFT = 0.5; // s

const MIN_SPEED = 1 / 16;
const MAX_SPEED = 16;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export default class Synchronizer {
	controllerMedi;
	targetMedi;

	offsetTime;
	offsetRateFactor = 1;

	// TODO very long constructor

	constructor(controllerMedia, targetMedia, offsetTime=0) {
		this.controllerMedi = new Medi(controllerMedia);
		this.targetMedi = new Medi(targetMedia);

		this.offsetTime = offsetTime;

		this.resyncTime();
		this.resyncRate();

		this.controllerMedi.on(Medi.EXTERNAL_PLAY, () => {
			this.targetMedi.play();
		});

		this.controllerMedi.on(Medi.EXTERNAL_PAUSE, async () => {
			await this.targetMedi.pause();
			await this.resyncTime();
		});

		this.controllerMedi.on(Medi.EXTERNAL_WAITING, () => {
			this.pitstopResyncTime();
		});

		this.targetMedi.on(Medi.EXTERNAL_WAITING, () => {
			this.pitstopResyncTime();
		});

		this.controllerMedi.on(Medi.SEEKING, () => {
			this.resyncTime();
		});

		this.controllerMedi.on(Medi.RATECHANGE, () => {
			this.resyncRate();
		});

		// TODO target video will sometimes pause and not restart (`triggeringPlay` is `true` when `pause` is called on Medi)

		const animloop = new Animloop(async now => {
			const targetVideoTimeDrift = this.targetVideoTimeDrift();

			// TODO inconsistent. Current settings may cause target media to overshoot by next iteration.
			// Changing playback rate to many different values can cause slowdown.

			// Edge condition (near end of video, when 1 video ends) is handled by the target video firing `pause`
			// when ending.

			// console.log(targetVideoTimeDrift);

			if (Math.abs(targetVideoTimeDrift) > MAX_CORRECTABLE_TIME_DRIFT) {
				console.log("drift too big");
				await this.pitstopResyncTime();
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

		this.targetMedi.on(Medi.PLAYBACK_START, () => {
			animloop.start();
		});

		this.targetMedi.on(Medi.PLAYBACK_STOP, () => {
			animloop.stop();
		});
	}

	pauseAllMedia() {
		return Promise.all([
			this.controllerMedi.pause(),
			this.targetMedi.pause(),
		]);
	}

	playAllMedia() {
		return Promise.all([
			this.controllerMedi.play(),
			this.targetMedi.play(),
		]);
	}

	stifleExternalPlayAllMedia() {
		return [
			this.controllerMedi.stifleExternalPlay(),
			this.targetMedi.stifleExternalPlay(),
		];
	}

	async pitstopResyncTime() {
		const reenablers = this.stifleExternalPlayAllMedia();

		await this.pauseAllMedia();
		await this.resyncTime();
		await this.playAllMedia();

		reenablers.map(reenable => reenable());
	}

	resyncTime() {
		return this.targetMedi.seek(this.controllerMedi.time + this.offsetTime);
	}

	resyncRate() {
		return this.targetMedi.accel(clamp(this.controllerMedi.rate * this.offsetRateFactor, MIN_SPEED, MAX_SPEED));
	}

	targetVideoTimeDrift() {
		return this.targetMedi.time - this.controllerMedi.time - this.offsetTime;
	}
}