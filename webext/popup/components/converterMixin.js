const identity = value => value;

export default {
	props: {
		convertIn: {
			type: Function,
			default: identity,
		},

		convertOut: {
			type: Function,
			default: identity,
		},

		value: {
			type: Number,
			default: 0,
		},
	},

	computed: {
		isFocused() {
			return document.activeElement === this.$el;
		},
	},

	methods: {
		updateInputValue() {
			this.$el.value = this.convertIn(this.value);
		},
	},

	mounted() {
		this.updateInputValue();
	},
};