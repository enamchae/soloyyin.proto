<template>
	<main :data-disabled="!contentScriptLoaded">
		<OptionsControls />
	</main>
</template>

<script>
import contentScriptPromise from "./ContentComm.js";
import OptionsControls from "./components/OptionsControls.vue";

let Content;

export default {
	name: "root",

	data: () => ({
		contentScriptLoaded: false,
	}),
	
	async created() {
		Content = await contentScriptPromise;
		this.contentScriptLoaded = true;
	},

	components: {
		OptionsControls,
	},
};	
</script>

<style>
* {
	box-sizing: border-box;
}

:disabled,
[data-disabled] {
	pointer-events: none;
	
	opacity: .5;
}
</style>