<template>
	<button id="pick-new-media" @click="log">Select media</button>
</template>

<script>
export default {
	name: "Main",

	methods: {
		log() {
			console.log("clicked");
		},
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