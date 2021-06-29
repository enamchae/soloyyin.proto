<template>
	<main :data-disabled="!contentScriptLoaded">
		<button id="pick-new-media" @click="pickNewMedia">Select media</button>

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

	methods: {
		async pickNewMedia() {
			console.log("Picking new media");

			await Content.promptPickNewMedia();
			console.log("New media selected");

			console.log(await Content.getEngineOptions());

			Content.startEngine();
		},
	},
	
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
:disabled,
[data-disabled] {
	pointer-events: none;
	
	opacity: .5;
}
</style>