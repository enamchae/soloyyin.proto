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

:root {
	--loud-abyss: hsl(180, 51%, 10%);
	--loud-background: hsl(180, 43%, 23%);
	--loud-mid: hsl(180, 48%, 37%);
	--loud-color: hsl(180, 70%, 80%);

	--soft-abyss: hsl(0, 51%, 10%);
	--soft-background: hsl(0, 43%, 23%);
	--soft-mid: hsl(0, 48%, 37%);
	--soft-color: hsl(0, 70%, 80%);

	--neutral-background: hsl(0, 0%, 23%);
	--neutral-color: #fff;

	--color: currentcolor;
}

body {
	margin: 0;
	padding: .5em;

	color: var(--neutral-color);
	font-family: Zilla Slab;
	background: #222;
}

input,
button {
	color: inherit;
	font-family: inherit;
	background: none;
	border: none;
}

input[type="text"] {
	border-bottom: 2px solid;
}

button {
	border: 2px solid;
}

button:hover {
	--neutral-color-translucent: #ffffff4f;
	--checkerboard-repeat-size: 8px;
	--checkerboard-offset-size: calc(var(--checkerboard-repeat-size) / 2);
	--checkerboard-offset-size-neg: calc(var(--checkerboard-repeat-size) / -2);

	background:
			linear-gradient(45deg, var(--neutral-color-translucent) 25%, #0000 25%),
			linear-gradient(-45deg, var(--neutral-color-translucent) 25%, #0000 25%),
			linear-gradient(45deg, #0000 75%, var(--neutral-color-translucent) 75%),
			linear-gradient(-45deg, #0000 75%, var(--neutral-color-translucent) 75%);
	background-position:
			0 0,
			0 var(--checkerboard-offset-size),
			var(--checkerboard-offset-size) var(--checkerboard-offset-size-neg),
			var(--checkerboard-offset-size-neg) 0;
	background-size: var(--checkerboard-repeat-size) var(--checkerboard-repeat-size);
}

button:active {
	--color: var(--neutral-color);
	border-color: var(--neutral-color);
	background: var(--neutral-color);
	color: var(--neutral-background);
}
</style>