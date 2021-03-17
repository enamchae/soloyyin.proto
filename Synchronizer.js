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

		const onplaying = async event => {
			targetVideo.removeEventListener("playing", onplaying);

			await bufferVideo.play();

			this.resyncTime();

			targetVideo.addEventListener("playing", onplaying);
		};

		targetVideo.addEventListener("playing", onplaying);

		targetVideo.addEventListener("pause", () => {

		});

		targetVideo.addEventListener("ratechange", () => {
			this.resyncRate();
		});
	}

	resyncTime() {
		this.bufferVideo.currentTime = this.targetVideo.currentTime + this.offsetTime;
	}

	resyncRate() {
		this.bufferVideo.playbackRate = this.targetVideo.playbackRate
	}
}