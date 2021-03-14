const mod = (a, b) => (a % b + b) % b;

export default class RollingF32Array {
	#array;

	/** Number of pushed values still saved in this array. */
	pushload = 0;
	/** Absolute index of the first item in this array. */
	startOffset = 0;

	#capacity;
	get capacity() {
		return this.#capacity;
	}

	constructor(capacity) {
		this.#array = new Float32Array(capacity);
		this.#capacity = this.#array.length;
	}

	#absIndexFromRel(relativeIndex) {
		return mod(this.startOffset + relativeIndex, this.#capacity);
	}

	/**
	 * @returns (Can be out-of-bounds; will work with getter/setter methods anyway.)
	 */
	#relIndexFromAbs(absoluteIndex) {
		return absoluteIndex - this.startOffset;
	}

	get(index) {
		return this.#array[this.#absIndexFromRel(index)];
	}

	set(index, value) {
		this.#array[this.#absIndexFromRel(index)] = value;
	}

	pushItem(item) {
		this.set(0, item);

		this.pushload = Math.min(this.pushload + 1, this.#capacity);
		this.startOffset = mod(this.startOffset + 1, this.#capacity);
	}

	push(...items) {
		for (const item of items) {
			this.pushItem(item);
		}
	}

	* [Symbol.iterator]() {
		for (let i = this.startOffset; i < this.#array.length; i++) {
			yield this.#array[i];
		}

		for (let i = 0; i < this.startOffset; i++) {
			yield this.#array[i];
		}
	}

	* pushloadValues() {
		for (let i = -this.pushload; i < 0; i++) {
			yield this.get(i);
		}
	}

	clear() {
		this.#array = new Float32Array(this.#capacity);
	}
};