<template>
	<section>
		<zone-indicators>
			<zone- :class="['loud', {'in-zone': engine.data.active && engine.data.lastIsLoud }]"></zone->
			<zone- :class="['soft', {'in-zone': engine.data.active && !engine.data.lastIsLoud }]"></zone->
		</zone-indicators>

		<options-controls>
			<div class="grid">
				<button class="pick-new-media" @click="pickMedia" :disabled="selectingMedia" v-html="selectingMedia ? 'Click on media…<br />🡿' : 'Select media'"></button>
				<button class="recorder-toggle" @click="toggleEngine" :disabled="!engine.data.mediaSelected || engineToggling">{{engine.data.active ? "❚❚ Stop tracking" : "▶ Start tracking"}}</button>

				<option-set class="loud">
					<label>Loud playback speed</label>
					<Slider v-model="engine.options.loudSpeed"
							:minValue="-3"
							:maxValue="3"
							:convertIn="trueValue => Math.log2(trueValue)"
							:convertOut="displayValue => 2 ** displayValue" />
					<Entry v-model="engine.options.loudSpeed"
							:validate="value => 1/8 <= value && value <= 8" />
				</option-set>

				<option-set class="soft">
					<label>Quiet playback speed</label>
					<Slider v-model="engine.options.softSpeed"
							:minValue="-3"
							:maxValue="3"
							:convertIn="trueValue => Math.log2(trueValue)"
							:convertOut="displayValue => 2 ** displayValue" />
					<Entry v-model="engine.options.softSpeed"
							:validate="value => 1/8 <= value && value <= 8" />
				</option-set>

				<ThresholdSlider v-model="engine.options.thresholdAmp"
						:convertIn="value => Math.cbrt(value)"
						:convertOut="value => value ** 3"
						:engine="engine" />

				<option-set class="threshold-amp">
					<label>Loudness threshold (<abbr title="decibels, relative to maximum amplitude">dBFS</abbr>)</label>
					<Entry v-model="engine.options.thresholdAmp"
							:convertIn="dbfsFromAmp"
							:convertOut="ampFromDbfs"
							:validate="value => 0 <= value && value <= 1" />
				</option-set>
			</div>

			<table>
				<tr>
					<th>Greatest captured loudness (<abbr title="decibels, relative to maximum amplitude">dBFS</abbr>)</th>
					<td>{{dbfsFromAmp(engine.data.lastMaxAmp)}}</td>
				</tr>
			</table>
		</options-controls>
	</section>
</template>

<script>
import EngineManager from "../engine.js";
import ExtremaAnalyser from "@lib/volume-calc/ExtremaAnalyser.js";
import Entry from "./input/Entry.vue";
import Slider from "./input/Slider.vue";
import ThresholdSlider from "./input/ThresholdSlider.vue";

export default {
	name: "optionscontrols",
	
	data: () => ({
		engine: new EngineManager(),

		selectingMedia: false,
		engineToggling: false,
	}),

	methods: {
		promptUserPickMedia() {
			return new Promise(resolve => {
				const onpointerdown = event => {
					const elements = document.elementsFromPoint(event.pageX, event.pageY);

					for (const element of elements) {
						if (!(element instanceof HTMLMediaElement)) continue;

						removeEventListener("pointerdown", onpointerdown);

						resolve(element);
						break;
					}
				};

				addEventListener("pointerdown", onpointerdown);
			})
		},

		async pickMedia() {
			if (this.selectingMedia) throw new Error();

			this.selectingMedia = true;
			console.log("Picking new media");
			const media = await this.promptUserPickMedia();
			console.log(media);
			this.selectingMedia = false;

			this.engine.setMedia(media);
		},

		async toggleEngine() {
			if (this.engineToggling) throw new Error();

			this.engineToggling = true;
			await this.engine.toggle();
			this.engineToggling = false;
		},

		ampFromDbfs: ExtremaAnalyser.ampFromDbfs,
		dbfsFromAmp: ExtremaAnalyser.dbfsFromAmp,
	},

	components: {
		Entry,
		Slider,
		ThresholdSlider,
	},
};
</script>

<style scoped>
section {
	display: grid;
}

section > * {
	grid-area: 1 / 1;
}

zone-indicators {
	display: grid;
	grid-template-rows: repeat(2, 1fr);
}

zone-.loud {
	background: var(--loud-abyss);
}

zone-.loud.in-zone {
	background: var(--loud-background);
}

zone-.soft {
	background: var(--soft-abyss);
}

zone-.soft.in-zone {
	background: var(--soft-background);
}

options-controls {
	padding: .5em;
}

options-controls,
label {
	display: block;
}

.grid {
	min-height: 8em;
	display: grid;
	grid-auto-flow: column;
	grid-template: repeat(2, auto) / repeat(4, auto);
	gap: 1em;
}

:where(.grid > *) {
	width: 100%;
	height: 100%;
}

.grid > * {
	border: 1px solid var(--color);
	box-shadow: 2px 2px var(--color);
}

.grid > button {
	border-width: 2px;
}

.grid > threshold-slider,
.grid > option-set.threshold-amp {
	grid-area: span 2 / auto;
}

.grid > option-set {
	display: flex;
	flex-flow: column;
	justify-content: center;
}

option-set {
	padding: .5em;
}

option-set.loud {
	color: var(--loud-color);
}

option-set.soft {
	color: var(--soft-color);
}

threshold-slider {
	width: 3em;
}
</style>