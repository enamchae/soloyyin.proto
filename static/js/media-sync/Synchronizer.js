import {TimeoutLoop} from "../util/Looper.js";
import Medi from "./Medi.js";

const TIME_DRIFT_CORRECTION_SPEED_FACTOR = 1.25;
const BEGIN_CORRECTION_TIME_DRIFT = 0.025; // s
const END_CORRECTION_TIME_DRIFT = 0.01; // s
const MAX_CORRECTABLE_TIME_DRIFT = 0.5; // s

const MIN_SPEED = 1 / 16;
const MAX_SPEED = 16;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export default class Synchronizer {
	controllerMedi;
	targetMedi;

	offsetTime;
	offsetRateFactor = 1;

	constructor(controllerMedia, targetMedia, offsetTime=0) {
		this.controllerMedi = new Medi(controllerMedia);
		this.targetMedi = new Medi(targetMedia);

		this.offsetTime = offsetTime;
	}
	
	onReload() {
		const reenable = this.stifleControllerExternalPlay();

		return this.continueLoadAllMedia()
				.finally(() => { reenable(); })
				.catch(() => this.waitForReload());
	}

	waitForReload() {
		return new Promise(resolve => {
			this.controllerMedi.on(Medi.LOAD_BEGIN, () => {
				// Retry
				resolve(this.onReload());
			}, {once: true});
		});
	}

	/**
	 * 
	 * @returns Function to stop synching.
	 */
	sync() {
		this.resyncTime();
		this.resyncRate();

		let pauseListener;

		const listeners = [
			pauseListener = this.controllerMedi.on(Medi.EXTERNAL_PLAY, () => {
				this.targetMedi.play();
			}),
	
			this.controllerMedi.on(Medi.EXTERNAL_PAUSE, async () => {
				await this.targetMedi.pause();
				await this.resyncTime();
			}),
	
			this.controllerMedi.on(Medi.EXTERNAL_WAITING, () => {
				this.pitstopResyncTime();
			}),
	
			this.targetMedi.on(Medi.EXTERNAL_WAITING, () => {
				this.pitstopResyncTime();
			}),
	
			this.controllerMedi.on(Medi.SEEK_BEGIN, () => {
				this.resyncTime();
			}),
	
			this.controllerMedi.on(Medi.RATECHANGE, () => {
				this.resyncRate();
			}),

			this.controllerMedi.on(Medi.LOAD_BEGIN, async () => {
				this.targetMedi.pause();

				unsync();

				await this.onReload();
				this.sync();
			}),
		];

		if (!this.controllerMedi.paused) {
			pauseListener.handler();
		}

		let usingSpeedCorrection = false;
		const correctionThreshold = () => usingSpeedCorrection ? END_CORRECTION_TIME_DRIFT : BEGIN_CORRECTION_TIME_DRIFT;
		const timeDriftLoop = new TimeoutLoop(async now => {
			// may be fragile
			if (this.targetMedi.triggeringPause || this.controllerMedi.triggeringPause || this.targetMedi.paused || this.controllerMedi.paused) {
				return;
			}

			const timeDrift = this.targetMediaTimeDrift();

			// Edge condition (near end of video, when 1 video ends) is handled by the target video firing `pause`
			// when ending.

			if (Math.abs(timeDrift) > MAX_CORRECTABLE_TIME_DRIFT) {
				// console.log("drift too big");

				await this.pitstopResyncTime();
				usingSpeedCorrection = false;
				return;
			}

			if (timeDrift < -correctionThreshold()) {
				this.offsetRateFactor = TIME_DRIFT_CORRECTION_SPEED_FACTOR;
				usingSpeedCorrection = true;
			} else if (timeDrift > correctionThreshold()) {
				this.offsetRateFactor = 1 / TIME_DRIFT_CORRECTION_SPEED_FACTOR;
				usingSpeedCorrection = true;
			} else {
				this.offsetRateFactor = 1;
				usingSpeedCorrection = false;
			}

			this.resyncRate();
		});

		listeners.push(
			this.targetMedi.on(Medi.PLAYBACK_START, () => {
				timeDriftLoop.start();
			}),

			this.targetMedi.on(Medi.PLAYBACK_STOP, () => {
				timeDriftLoop.stop();
				usingSpeedCorrection = false;
			}),
		);

		const unsync = () => {
			for (const listener of listeners) {
				listener.detach();
			}

			timeDriftLoop.stop();
		};

		return unsync;
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

	untilLoadAllMedia() {
		return Promise.all([
			this.controllerMedi.untilLoad(),
			this.targetMedi.untilLoad(),
		]);
	}

	continueLoadAllMedia() {
		return Promise.all([
			this.controllerMedi.continueLoad(),
			this.targetMedi.continueLoad(),
		]);
	}

	stifleControllerExternalPlay() {
		return this.controllerMedi.stifleExternalPlay();
	}

	pitstopPromise = null;
	pitstopResyncTime() {
		if (this.pitstopPromise) return this.pitstopPromise; // temp check?

		// const reenable = this.stifleControllerExternalPlay();

		this.pitstopPromise = (async () => {
			await this.pauseAllMedia();
			await this.resyncTime();
			await this.playAllMedia();
		})().finally(() => {
			// reenable();
			this.pitstopPromise = null;
		});
	}

	resyncTime() {
		return this.targetMedi.seek(this.controllerMedi.time + this.offsetTime);
	}

	resyncRate() {
		return this.targetMedi.accel(clamp(this.controllerMedi.rate * this.offsetRateFactor, MIN_SPEED, MAX_SPEED));
	}

	targetMediaTimeDrift() {
		return this.targetMedi.time - this.controllerMedi.time - this.offsetTime;
	}
}

export class TwinSync extends Synchronizer {
	onReload() {
		return new Promise(resolve => {
			const reenable = this.stifleControllerExternalPlay();
			
			// By the time `loadedmetadata` fires, the `currentSrc` property will have updated;
			// this is not the case with MutationObserver.
			let handlerExecuted = false;
			const metadataListener = this.controllerMedi.on(Medi.LOAD_METADATA_END, async () => {
				if (this.targetMedi.currentSrc !== this.controllerMedi.currentSrc) {
					this.resyncSrc();
				}
	
				if (handlerExecuted) return;
				handlerExecuted = true;
		
				resolve(this.untilLoadAllMedia()
						.finally(() => {
							metadataListener.detach();
							reenable();
						})
						.catch(() => this.waitForReload())
				);
			});

			if (this.controllerMedi.loadedMetadata) {
				metadataListener.handler();
			}
		});
	}

	resyncSrc() {
		return this.targetMedi.resrc(this.controllerMedi.currentSrc);
	}
}