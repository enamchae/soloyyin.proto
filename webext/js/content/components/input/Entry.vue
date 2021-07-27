<template>
	<input type="text" @input="onInput" @change.stop="onChange" @focus="onFocus" @blur="onBlur" :class="{invalid: !proposedValueIsValid}" />
</template>

<script>
import converterMixin from "./converterMixin.js";

const acceptAlways = () => true;

export default {
	name: "entry",

	mixins: [converterMixin],

	props: {
		validate: {
			type: Function,
			default: acceptAlways,
		},
	},

	data() {
		return {
			proposedValueIsValid: true,
			isFocused: false,
		};
	},

	methods: {
		onInput(event) {
			const proposedValue = this.convertOut(Number(this.$el.value));

			this.proposedValueIsValid = this.validate(proposedValue);
			if (this.proposedValueIsValid) {
				this.$emit("input", proposedValue);
			} else {
				event.stopPropagation();
			}
		},

		onChange() {
			this.updateDisplayValue();
			this.proposedValueIsValid = true;
		},

		onFocus() {
			this.isFocused = true;
		},

		onBlur() {
			this.isFocused = false;
		},
	},
	
	watch: {
		value() {
			if (this.isFocused) return;
			this.updateDisplayValue();
		},
	},
};
</script>

<style scoped>
.invalid {
	color: red;
}
</style>