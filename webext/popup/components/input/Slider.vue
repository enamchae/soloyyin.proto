<template>
	<input type="range" step="any" :min="minValue" :max="maxValue" @input="handleInput" @change="updateInputValue">
</template>

<script>
import converterMixin from "./converterMixin.js";

export default {
	name: "slider",

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
	},
	
	watch: {
		value() {
			this.updateInputValue();
		},
	},
};
</script>