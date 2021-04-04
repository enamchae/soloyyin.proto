const dispatchEvent = (medi, eventType) => {
	// console.log(eventType, medi.media.attributes.getNamedItem("!!controller") ? 1 : 2);
	medi.eventTarget.dispatchEvent(new CustomEvent(eventType, {
		detail: {
			media: medi.media,
		},
	}));
};

// TODO observations in comments regarding media events are empirical and may not be guaranteed by the specification
// https://html.spec.whatwg.org/multipage/media.html#mediaevents

/**
 * Wrapper for media elements that provides some extra events and methods.
 */
export default class Medi {
	/** Will not fire when external play is stifled. */
	static EXTERNAL_PLAY = "externalplay";
	static EXTERNAL_PAUSE = "externalpause";
	/** Will not fire when external play is stifled. */
	static EXTERNAL_PLAYBACK_START = "externalplaying";
	static EXTERNAL_WAITING = "externalwaiting";

	/** Like `EXTERNAL_PLAY`, but will fire regardless of whether external play is stifled. */
	static STIFLABLE_EXTERNAL_PLAY = "stiflableexternalplay";
	/** Like `EXTERNAL_PLAYBACK_START`, but will fire regardless of whether external play is stifled. */
	static STIFLABLE_EXTERNAL_PLAYBACK_START = "stiflableexternalplaying";

	static PLAY = "play";
	static PAUSE = "pause";
	static WAITING = "waiting";

	static RATECHANGE = "ratechange";
	static SEEKING = "seeking";
	
	/** Alias for `playing`. */
	static PLAYBACK_START = "playing";
	/** Fired when playback stops (captures `pause`, and conditionally `waiting`, `seeking`, and `loadstart`). */
	static PLAYBACK_STOP = "stop";

	static LOAD_BEGIN = "loadstart";
	static LOAD_METADATA_END = "loadedmetadata";
	static LOAD_END = "loadeddata";

	// static SRC_URL_CHANGE = "srcurlchange";

	eventTarget = new EventTarget();
	media;

	mediaState = MediaState.PAUSED;

	triggeringPlay = false;
	triggeringPause = false;
	awaitingSeeked = false;
	get triggeringWaiting() {
		return this.triggeringPlay || this.awaitingSeeked;
	}

	externalPlayStifled = false;

	get time() {
		return this.media.currentTime;
	}

	get rate() {
		return this.media.playbackRate;
	}

	get paused() {
		return this.media.paused;
	}

	get loaded() {
		return this.media.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
	}

	get loadedMetadata() {
		return this.media.readyState >= HTMLMediaElement.HAVE_METADATA;
	}

	get currentSrc() {
		return this.media.currentSrc;
	}

	constructor(media) {
		this.media = media;

		this.media.addEventListener("play", event => {
			this.mediaState = MediaState.PLAYBACK_STOPPED;

			if (!this.triggeringPlay && !this.externalPlayStifled) {
				dispatchEvent(this, Medi.EXTERNAL_PLAY);
			}
			
			if (!this.triggeringPlay) {
				dispatchEvent(this, Medi.STIFLABLE_EXTERNAL_PLAY);
			}

			dispatchEvent(this, Medi.PLAY);
		});

		this.media.addEventListener("playing", event => {
			this.mediaState = MediaState.PLAYBACK_STARTED;

			// `playing` is fired before `play()` resolves
			if (!this.triggeringPlay && !this.externalPlayStifled) {
				dispatchEvent(this, Medi.EXTERNAL_PLAYBACK_START);
			}
			
			if (!this.triggeringPlay) {
				dispatchEvent(this, Medi.STIFLABLE_EXTERNAL_PLAYBACK_START);
			}

			dispatchEvent(this, Medi.PLAYBACK_START);
		});

		this.media.addEventListener("pause", event => {
			this.mediaState = MediaState.PAUSED;

			if (!this.triggeringPause) {
				dispatchEvent(this, Medi.EXTERNAL_PAUSE);
			}

			dispatchEvent(this, Medi.PAUSE);
			dispatchEvent(this, Medi.PLAYBACK_STOP);
		});

		this.media.addEventListener("waiting", event => {
			// `waiting` may fire before `playing`
			const firedWhilePlaying = this.mediaState === MediaState.PLAYBACK_STARTED;
			this.mediaState = MediaState.PLAYBACK_STOPPED;

			if (!this.triggeringWaiting && !this.externalPlayStifled) {
				// TODO due to this, stifling external play might cause inconsistent results if `pause` is not called afterward
				dispatchEvent(this, Medi.EXTERNAL_WAITING);
			}

			dispatchEvent(this, Medi.WAITING);

			if (firedWhilePlaying) {
				dispatchEvent(this, Medi.PLAYBACK_STOP);
			}
		});

		this.media.addEventListener("seeking", event => {
			const firedWhilePlaying = this.mediaState === MediaState.PLAYBACK_STARTED;
			this.mediaState = MediaState.PLAYBACK_STOPPED;

			dispatchEvent(this, Medi.SEEKING);

			if (firedWhilePlaying) {
				dispatchEvent(this, Medi.PLAYBACK_STOP);
			}
		});

		this.media.addEventListener("loadstart", event => {
			const firedWhilePlaying = this.mediaState === MediaState.PLAYBACK_STARTED;
			this.mediaState = MediaState.PAUSED;

			if (firedWhilePlaying) {
				dispatchEvent(this, Medi.PLAYBACK_STOP);
			}

			dispatchEvent(this, Medi.LOAD_BEGIN);
		});

		this.media.addEventListener("ratechange", event => {
			dispatchEvent(this, Medi.RATECHANGE);
		});

		this.media.addEventListener("loadedmetadata", () => {
			dispatchEvent(this, Medi.LOAD_METADATA_END);
		});

		this.media.addEventListener("loadeddata", () => {
			dispatchEvent(this, Medi.LOAD_END);
		});
	}

	async play() {
		if (this.triggeringPlay) return;

		// console.log("\tstart PLAY", this.media.attributes.getNamedItem("!!controller") ? 1 : 2);

		this.triggeringPlay = true;
		await this.rawPlay();
		this.triggeringPlay = false;

		// console.log("\tdone PLAY", this.media.attributes.getNamedItem("!!controller") ? 1 : 2);
	}

	async pause() {
		if (this.triggeringPause || this.triggeringPlay) return;

		// console.log("\tstart PAUSE", this.media.attributes.getNamedItem("!!controller") ? 1 : 2, new Error());

		this.triggeringPlay = true;
		this.triggeringPause = true;
		await this.rawPause();
		this.triggeringPlay = false;
		this.triggeringPause = false;

		// console.log("\tdone PAUSE", this.media.attributes.getNamedItem("!!controller") ? 1 : 2, this.media.paused);
	}

	async seek(time) {
		if (this.awaitingSeeked) return;

		this.awaitingSeeked = true;
		await this.rawSeek(time);
		this.awaitingSeeked = false;
	}

	accel(rate) {
		this.media.playbackRate = rate;
	}

	resrc(src) {
		this.media.src = src;
	}

	continueLoad() {
		if (!this.loaded) {
			this.media.load();
		}
		return this.untilLoaded();
	}

	rawPlay() {
		return this.media.play();
	}

	rawPause() {
		return new Promise(async resolve => {
			if (this.media.paused) {
				resolve();
				return;
			}
	
			// Try to ensure that the `pause` call does not interrupt an in-progress `play` call
			await this.media.play();

			// `pause` event fires some time after calling `pause`
			this.media.addEventListener("pause", () => {
				resolve();
			}, {once: true});
			this.media.pause();

/* 			const onplaying = () => {
				// `pause` event fires some time after calling `pause`
				this.media.addEventListener("pause", () => {
					resolve();
				}, {once: true});
	
				this.media.pause();
			};

			if (this.mediaState === MediaState.PLAYBACK_STARTED) {
				onplaying();
			} else {
				this.media.addEventListener("playing", onplaying, {once: true});
			} */
		});
	}

	rawSeek(time) {
		// Setting `currentTime` when paused will fire "seeking" at start, then {"timeupdate", "seeked"} and "canplay" last
		// Setting `currentTime` when playing will fire {"seeking", "waiting"(?)} at start, then {"timeupdate", "seeked"} and "canplay" and "playing" last
		// Interrupting a seek will fire "seeking" again but no other duplicate events
		return new Promise(resolve => {
			this.media.addEventListener("seeked", () => {
				resolve();
			}, {once: true});

			this.media.currentTime = time;
		});
	}

	on(eventType, handler, options) {
		this.eventTarget.addEventListener(eventType, handler, options);
		return new Listener(this.eventTarget, eventType, handler, options);
	}

	off(eventType, handler) {
		this.eventTarget.removeEventListener(eventType, handler);
	}

	untilLoaded() {
		return new Promise((resolve, reject) => {
			if (this.loaded) {
				resolve();
				return;
			}

			if (this.media.error) {
				reject(this.media.error);
				return;
			}

			const onsuccess = () => {
				this.media.removeEventListener("error", onfailure, {once: true});
				resolve();
			};

			const onfailure = () => {
				this.media.removeEventListener("loadeddata", onsuccess, {once: true});
				reject(this.media.error);
			};

			this.media.addEventListener("loadeddata", onsuccess, {once: true});

			this.media.addEventListener("error", onfailure, {once: true});
		});
	}

/* 	untilLoadedMetadata() {
		return new Promise((resolve, reject) => {
			if (this.loadedMetadata) {
				resolve();
				return;
			}

			if (this.media.error) {
				reject(this.media.error);
				return;
			}

			const onsuccess = () => {
				this.media.removeEventListener("error", onfailure, {once: true});
				resolve();
			};

			const onfailure = () => {
				this.media.removeEventListener("loadedmetadata", onsuccess, {once: true});
				reject(this.media.error);
			};

			this.media.addEventListener("loadedmetadata", onsuccess, {once: true});

			this.media.addEventListener("error", onfailure, {once: true});
		});
	} */

	/**
	 * Stifles external play events by pausing the media immediately.
	 * @returns Function to disable the play stifler.
	 */
	stifleExternalPlay() {
		if (this.externalPlayStifled) throw new Error();

		// `preventDefault` does nothing on `play` or `playing` events

		const startTime = this.time;
		const playStiflerListener = this.on(Medi.STIFLABLE_EXTERNAL_PLAYBACK_START, async () => {
			await this.pause();
			await this.seek(startTime);
		});
		this.externalPlayStifled = true;
		
		let tried = false;
		return () => {
			if (tried) return;
			tried = true;

			playStiflerListener.detach();
			this.externalPlayStifled = false;
		};
	}
}

/**
 * @enum
 */
export const MediaState = Object.freeze(class MediaState {
	static PAUSED = new MediaState({paused: true, playbackStarted: false});
	static PLAYBACK_STOPPED = new MediaState({paused: false, playbackStarted: false});
	static PLAYBACK_STARTED = new MediaState({paused: false, playbackStarted: true});

	paused;
	playbackStarted;

	constructor({paused, playbackStarted}) {
		this.paused = paused;
		this.playbackStarted = playbackStarted;
		Object.freeze(this);
	}
});

class Listener {
	target;
	type;
	handler;
	options;

	constructor(target, type, handler, options) {
		this.target = target;
		this.type = type;
		this.handler = handler;
		this.options = options;
	}

	detach() {
		this.target.removeEventListener(this.type, this.handler, this.options);
	}
}