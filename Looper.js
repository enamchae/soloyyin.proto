const NOOP = async () => {};

class Looper {
	timerHandle = 0;

	onIteration;
	iterationCallback;

	get stopped() {
		return this.timerHandle === 0;
	}

	constructor(onIteration=NOOP) {
		this.onIteration = onIteration;

		this.iterationCallback = this.createIterationCallback();
	}

	start() {
		throw new TypeError("not implemented");
	}

	stop() {
		throw new TypeError("not implemented");
	}

	createIterationCallback() {
		throw new TypeError("not implemented");
	}
}

export class AnimLoop extends Looper {
	start() {
		if (!this.stopped) return;

		this.timerHandle = requestAnimationFrame(this.iterationCallback);
	}

	stop() {
		cancelAnimationFrame(this.timerHandle);
		this.timerHandle = 0;
	}

	createIterationCallback() {
		return async now => {
			await this.onIteration(now);

			if (this.stopped) return;
			this.timerHandle = requestAnimationFrame(this.iterationCallback);
		};
	}
}

export class TimeoutLoop extends Looper {
	start() {
		if (!this.stopped) return;

		this.timerHandle = setTimeout(this.iterationCallback);
	}

	stop() {
		clearTimeout(this.timerHandle);
		this.timerHandle = 0;
	}

	createIterationCallback() {
		return async () => {
			await this.onIteration(Date.now());

			if (this.stopped) return;
			this.timerHandle = setTimeout(this.iterationCallback);
		};
	}
}