<template>
	<threshold-slider>
		<slider-domains>
			<domain- class="loud"></domain->
			<domain- class="soft"></domain->
		</slider-domains>

		<slider-handles>
			<handle- @pointerdown="startDrag" :style="{'--handle-height': `${this.handleHeight}px`}"></handle->
		</slider-handles>
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
	},

	data() {
		return {
			handleActive: false,
			handleDragOffset: 0,

			handleHeight: 24,
		};
	},

	methods: {
		handleInput() {
			this.$emit("input", this.convertOut(Number(this.$el.value)));
		},

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
	},
};
</script>

<style scoped>
threshold-slider {
	display: grid;

	background: #99b;
	
	--value: 0;
}

threshold-slider > slider-domains {
	grid-area: 1 / 1;
	display: flex;
}

threshold-slider > slider-handles {
	grid-area: 1 / 1;
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