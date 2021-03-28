const NOOP = async () => {};

export default class Animloop {
	animationFrameHandle = 0;

	onAnimationFrame;
	animationFrameCallback;

	get stopped() {
		return this.animationFrameHandle === 0;
	}

	constructor(onAnimationFrame=NOOP) {
		this.onAnimationFrame = onAnimationFrame;

		this.animationFrameCallback = this.createAnimationFrameCallback();
	}

	start() {
		if (!this.stopped) return;

		this.animationFrameHandle = requestAnimationFrame(this.animationFrameCallback);
	}

	stop() {
		cancelAnimationFrame(this.animationFrameHandle);
		this.animationFrameHandle = 0;
	}

	createAnimationFrameCallback() {
		return async now => {
			await this.onAnimationFrame(now);

			if (this.stopped) return;
			this.animationFrameHandle = requestAnimationFrame(this.animationFrameCallback);
		};
	}
}