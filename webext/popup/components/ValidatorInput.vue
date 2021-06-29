<template>
	<input type="text" @input="validateInput" @change.stop="resetInput" :class="{invalid: proposedValueIsInvalid}" />
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

		value: {
			type: Number,
			default: 0,
		},
	},

	data() {
		return {
			unsafeValue: this.value,
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
		validateInput(event) {
			const proposedValue = Number(this.$el.value);

			this.unsafeValue = proposedValue;
			if (this.validate(proposedValue)) {
				this.value = proposedValue;
				this.$emit("input", this.value);
			} else {
				event.stopPropagation();
			}
		},

		resetInput() {
			this.unsafeValue = this.value;
			this.$el.value = this.value;
		},
	},

	watch: {
		initialValue(newValue, oldValue) {
			this.value = newValue;
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