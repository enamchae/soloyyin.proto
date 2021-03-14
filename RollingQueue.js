export default class RollingQueue {
	firstNode = null;
	lastNode = null;

	displace(inputs) {
		this.push(inputs);

		while (this.hasSuperfluousElements()) {
			this.shift();
		}
	}

	push(inputs) {
		const node = new QueueNode(inputs);

		if (this.lastNode) {
			this.lastNode.followingNode = node;
		} else {
			this.firstNode = node;
			this.lastNode = node;
		}
	}

	shift() {
		this.firstNode = this.firstNode.followingNode;

		if (!this.firstNode) {
			this.lastNode = null;
		}
	}

	hasSuperfluousElements() {
		return false;
	}

	get isEmpty() {
		return this.firstNode === null;
	}
}

class QueueNode {
	followingNode;

	value;

/* 	inputs;

	minMaxComputed = false;
	sampleMin = NaN;
	sampleMax = NaN; */

	constructor(value, followingNode=null) {
		this.value = value;
		// this.inputs = inputs;
		this.followingNode = followingNode;
	}
}

class MinMaxerRollingQueue extends RollingQueue {
	nSampleCapacity;
	sampleLoad = 0;

	// overallSampleMin = NaN;
	// overallSampleMax = NaN;

	constructor(nSampleCapacity=0) {
		this.nSampleCapacity = nSampleCapacity;
	}

	hasSuperfluousElements() {
		return false;
	}
}