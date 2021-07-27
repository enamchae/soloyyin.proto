<template>
	<main>
		<link rel="stylesheet" />

		<OptionsControls />
	</main>
</template>

<script>
import browser from "webextension-polyfill";
import OptionsControls from "./components/OptionsControls.vue";

export default {
	name: "soloui",

	async mounted() {
		this.$el.querySelector("link").href = browser.runtime.getURL("./content/index.css");
	},

	components: {
		OptionsControls,
	},
};
</script>