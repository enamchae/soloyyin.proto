<template>
	<main :data-disabled="!contentScriptLoaded">
		<button id="pick-new-media" @click="pickNewMedia">Select media</button>
	</main>
</template>

<script>
import contentScriptPromise from "./index.js";

let tab;
let Content;

export default {
	name: "Main",

	data: () => ({
		contentScriptLoaded: false,
	}),

	methods: {
		async pickNewMedia() {
			console.log("Picking new media");

			await Content.promptPickNewMedia();
			console.log("New media selected");

			console.log(await Content.getEngineOptions());

			Content.message("start");
		},
	},
	
	async created() {
		({tab, Content} = await contentScriptPromise);
		this.contentScriptLoaded = true;
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