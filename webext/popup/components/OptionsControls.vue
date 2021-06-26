<template>
	<options-controls>
		<p>{{engineOptions}}</p>
	</options-controls>
</template>

<script>
import contentScriptPromise from "../ContentComm.js";

let Content;

export default {
	name: "optionscontrols",
	
	data: () => ({
		engineOptionsLoaded: false,

		engineOptions: null,
	}),

	async created() {
		Content = await contentScriptPromise;
		this.engineOptions = await Content.getEngineOptions();

		this.engineOptionsLoaded = true;
	},
};
</script>
