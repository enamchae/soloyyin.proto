<template>
	<threshold-slider>
		<slider-domains>
			<domain- class="loud"></domain->
			<domain- class="soft"></domain->
		</slider-domains>

		<canvas></canvas>

		<slider-handles>
			<handle- @pointerdown="startDrag" :style="{'--handle-height': `${this.handleHeight}px`}"></handle->
		</slider-handles>

		<canvas class="amp-history"></canvas>
	<!-- <input type="range" step="any" :min="minValue" :max="maxValue" @input="handleInput" @change="updateDisplayValue"> -->
	</threshold-slider>
</template>

<script>
import converterMixin from "./converterMixin.js";

export default {
	name: "thresholdslider",

	mixins: [converterMixin],

	props: {
		minValue: {
			type: Number,
			default: 0,
		},

		maxValue: {
			type: Number,
			default: 1,
		},

		engineOptions: {
			type: Object,
			default: {},
		},

		engineData: {
			type: Object,
			default: {},
		},
	},

	data() {
		return {
			handleActive: false,
			handleDragOffset: 0,

			handleHeight: 24,
		};
	},

	methods: {
		updateDisplayValue() {
			this.$el.style.setProperty("--value", this.convertIn(this.value));
		},

		startDrag(event) {
			this.handleActive = true;
			this.handleDragOffset = event.pageY - this.$el.querySelector("handle-").offsetTop;
		},

		continueDrag(event) {
			if (!this.handleActive) return;
			
			const newPos = Math.max(0, Math.min(1, 1 - (event.pageY - this.$el.clientTop - this.handleDragOffset + this.handleHeight / 2) / this.$el.clientHeight));
			this.$emit("input", this.convertOut(newPos));
			this.$el.dispatchEvent(new Event("input", {bubbles: true}));

			getSelection().removeAllRanges();
		},

		endDrag() {
			this.handleActive = false;
		},
	},
	
	watch: {
		value() {
			this.updateDisplayValue();
		},
	},

	mounted() {
		addEventListener("pointermove", event => this.continueDrag(event));
		addEventListener("pointerup", event => this.endDrag(event));

		const canvas = this.$el.querySelector("canvas");
		canvas.width = this.$el.clientWidth;
		canvas.height = this.$el.clientHeight;
		const context = canvas.getContext("2d");
		context.fillStyle = "#0000007f";
		context.scale(canvas.width, -canvas.height);
		context.translate(0, -1);

		const updateDiagram = now => {
			context.clearRect(0, 0, canvas.width, canvas.height);
			context.fillRect(0, 0, 1, this.convertIn(this.engineData?.lastMaxAmp ?? 0));
			requestAnimationFrame(updateDiagram);
		};
		requestAnimationFrame(updateDiagram);
	},
};
</script>

<style scoped>
threshold-slider {
	display: grid;
	grid-template: auto / 100%; /* hm… didn't need this before */
	
	--value: 0;
}

threshold-slider > * {
	grid-area: 1 / 1;
}

slider-domains {
	display: grid;
	grid-template-rows: calc((1 - var(--value)) * 100%) 1fr;
}

slider-domains > * {
	display: block;
}

domain-.loud {
	background: var(--loud-mid);
}

domain-.soft {
	background: var(--soft-mid);
}

slider-handles {
	position: relative;
}

slider-handles > * {
	width: 100%;
	position: absolute;
}

handle- {
	display: flex;
	align-items: center;
	height: var(--handle-height);

	bottom: calc(clamp(0, var(--value), 1) * 100% - var(--handle-height) / 2);
	cursor: ns-resize;
}

handle-::after {
	content: " ";

	width: 100%;
	border: 4px solid #fff;

	box-shadow: 0 4px 4px #0003;
}
</style>