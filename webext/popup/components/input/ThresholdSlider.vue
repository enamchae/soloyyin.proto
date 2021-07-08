<template>
	<threshold-slider>
		<slider-domains>
			<domain- class="loud"></domain->
			<domain- class="soft"></domain->
		</slider-domains>

		<slider-handles>
			<handle-></handle->
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

	methods: {
		handleInput() {
			this.$emit("input", this.convertOut(Number(this.$el.value)));
		},

		updateDisplayValue() {
			this.$el.value = this.convertIn(this.value);
		},
	},
	
	watch: {
		value() {
			this.updateDisplayValue();
		},
	},
};
</script>

<style scoped>
threshold-slider {
	display: grid;

	background: #99b;
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
	border: 4px solid #fff;
	box-shadow: 0 4px 4px #0003;
}
</style>