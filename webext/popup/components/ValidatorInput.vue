<template>
	<input type="text" @input.stop="validateInput" @change.stop="resetInput" :class="{invalid: proposedValueIsInvalid}" />
</template>

<script>
const TRUEY = () => true;

export default {
	name: "validatorinput",

	props: {
		validate: {
			type: Function,
			default: TRUEY,
		},

		initialValue: {
			type: Number,
			default: 0,
		},
	},

	data() {
		return {
			value: this.initialValue,
			unsafeValue: this.initialValue,
		};
	},

	computed: {
/* 		displayValue() {
			return this.isFocused ? this.unsafeValue : this.value; 
		},

		isFocused() {
			return document.activeElement === this.$el;
		}, */

		proposedValueIsInvalid() {
			return this.value !== this.unsafeValue;
		},
	},

	methods: {
		validateInput() {
			const proposedValue = Number(this.$el.value);

			this.unsafeValue = proposedValue;
			if (this.validate(proposedValue)) {
				this.value = proposedValue;
			}
		},

		resetInput() {
			this.unsafeValue = this.value;
			this.$el.value = this.value;
		},
	},

	mounted() {
		this.$el.value = this.value;
	},
};
</script>

<style scoped>
.invalid {
	color: red;
}
</style>