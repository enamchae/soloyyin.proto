const NOOP = () => {};

export default class Animloop {
	animationFrameHandle = null;

	onAnimationFrame;
	animationFrameCallback;

	get stopped() {
		return this.animationFrameHandle === null;
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
		this.animationFrameHandle = null;
	}

	createAnimationFrameCallback() {
		return async now => {
			await this.onAnimationFrame(now);

			if (this.stopped) return;
			this.animationFrameHandle = requestAnimationFrame(this.animationFrameCallback);
		};
	}
}