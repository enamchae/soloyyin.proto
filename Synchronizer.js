export default class Synchronizer {
	targetVideo;
	bufferVideo;

	offsetTime;

	animationFrameHandle = null;

	constructor(targetVideo, bufferVideo, offsetTime=0) {
		this.targetVideo = targetVideo;
		this.bufferVideo = bufferVideo;

		this.offsetTime = offsetTime;

		this.resyncTime();
		this.resyncRate();

		// TODO doesn't work 

		const onplayTarget = async event => {
			event.preventDefault();

			// console.log("e");

			targetVideo.removeEventListener("play", onplayTarget);
			targetVideo.removeEventListener("pause", onpauseTarget);
			// targetVideo.removeEventListener("timeupdate", ontimeupdate);

			// this.resyncTime();

			const currentTime = targetVideo.currentTime;

			targetVideo.currentTime = currentTime;
			bufferVideo.currentTime = currentTime + this.offsetTime;

			// console.log("holup");
			
			await Promise.all([
				targetVideo.play(),
				bufferVideo.play(),
			]);

			targetVideo.addEventListener("play", onplayTarget);
			targetVideo.addEventListener("pause", onpauseTarget);
			// targetVideo.addEventListener("timeupdate", ontimeupdate);

			// this.startResyncLoop();
		};

		const onpauseTarget = async event => {
			// bufferVideo.removeEventListener("pause", onpauseTarget);

			await bufferVideo.pause();

			this.resyncTime();
			
			// this.stopResyncLoop();
		};

/* 		const ontimeupdate = () => {
			console.clear();
			console.log(bufferVideo.currentTime - targetVideo.currentTime);

			this.resyncTime();
		}; */

		const onpauseBuffer = async event => {

		};

		targetVideo.addEventListener("play", onplayTarget);
		targetVideo.addEventListener("pause", onpauseTarget);
		// targetVideo.addEventListener("timeupdate", ontimeupdate);
		targetVideo.addEventListener("ratechange", () => {
			this.resyncRate();
		});

		bufferVideo.addEventListener("pause", () => {

		});
	}

	resyncTime() {
		this.bufferVideo.currentTime = this.targetVideo.currentTime + this.offsetTime;
	}

	resyncRate() {
		this.bufferVideo.playbackRate = this.targetVideo.playbackRate
	}

/* 	startResyncLoop() {

		if (this.animationFrameHandle !== null) return;

		const resync = () => {
			if (this.animationFrameHandle === null) return;

			const currentTime = this.targetVideo.currentTime;
			this.targetVideo.currentTime = currentTime;
			this.bufferVideo.currentTime = currentTime;

			this.animationFrameHandle = requestAnimationFrame(resync);
		};
		this.animationFrameHandle = requestAnimationFrame(resync);
	}

	stopResyncLoop() {
		this.animationFrameHandle = null;
		cancelAnimationFrame(this.animationFrameHandle);
	} */
}