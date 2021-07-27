<template>
	<main>
		<link rel="stylesheet" />

		<p>Hello</p>

		<!-- <OptionsControls /> -->
		
	</main>
</template>

<script>
import browser from "webextension-polyfill";

// import contentScriptPromise from "./contentComm.js";
// import OptionsControls from "./components/OptionsControls.vue";

// let Content;

export default {
	name: "soloui",

	/* data: () => ({
		contentScriptLoaded: false,
	}),
	
	async created() {
		Content = await contentScriptPromise;
		this.contentScriptLoaded = true;
	},

	components: {
		OptionsControls,
	}, */

	async mounted() {
		this.$el.querySelector("link").href = browser.runtime.getURL("./content/index.css");
	},
};
</script>