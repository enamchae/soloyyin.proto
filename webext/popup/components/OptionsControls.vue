<template>
	<section>
		<zone-indicators>
			<zone- :class="['loud', {'in-zone': engineActive && engineData.lastIsLoud }]"></zone->
			<zone- :class="['soft', {'in-zone': engineActive && !engineData.lastIsLoud }]"></zone->
		</zone-indicators>

		<options-controls @input="setOptions">
			<div class="grid">
				<button class="pick-new-media" @click="pickNewMedia" :disabled="selectingMedia" v-html="selectingMedia ? 'Click on media…<br />🡿' : 'Select media'"></button>
				<button class="recorder-toggle" @click="toggleEngine" :disabled="!engineMediaSelected || engineToggling">{{engineActive ? "❚❚ Stop tracking" : "▶ Start tracking"}}</button>

				<option-set class="loud">
					<label>Loud playback speed</label>
					<Slider v-model="engineOptions.loudSpeed"
							:minValue="-3"
							:maxValue="3"
							:convertIn="trueValue => Math.log2(trueValue)"
							:convertOut="displayValue => 2 ** displayValue" />
					<Entry v-model="engineOptions.loudSpeed"
							:validate="value => 1/8 <= value && value <= 8" />
				</option-set>

				<option-set class="soft">
					<label>Quiet playback speed</label>
					<Slider v-model="engineOptions.softSpeed"
							:minValue="-3"
							:maxValue="3"
							:convertIn="trueValue => Math.log2(trueValue)"
							:convertOut="displayValue => 2 ** displayValue" />
					<Entry v-model="engineOptions.softSpeed"
							:validate="value => 1/8 <= value && value <= 8" />
				</option-set>

				<ThresholdSlider v-model="engineOptions.thresholdAmp"
						:convertIn="value => Math.cbrt(value)"
						:convertOut="value => value ** 3"
						:engineOptions="engineOptions"
						:engineData="engineData" />

				<option-set class="threshold-amp">
					<label>Loudness threshold (<abbr title="decibels, relative to maximum amplitude">dBFS</abbr>)</label>
					<Entry v-model="engineOptions.thresholdAmp"
							:convertIn="dbfsFromAmp"
							:convertOut="ampFromDbfs"
							:validate="value => 0 <= value && value <= 1" />
				</option-set>
			</div>

			<table>
				<tr>
					<th>Greatest captured loudness (<abbr title="decibels, relative to maximum amplitude">dBFS</abbr>)</th>
					<td>{{dbfsFromAmp(engineData.lastMaxAmp)}}</td>
				</tr>
			</table>
		</options-controls>
	</section>
</template>

<script>
import contentScriptPromise from "../ContentComm.js";
import ExtremaAnalyser from "@lib/volume-calc/ExtremaAnalyser.js";
import Entry from "./input/Entry.vue";
import Slider from "./input/Slider.vue";
import ThresholdSlider from "./input/ThresholdSlider.vue";

let Content;

export default {
	name: "optionscontrols",
	
	data: () => ({
		engineOptionsLoaded: false,
		
		selectingMedia: false,
		engineMediaSelected: false,
		engineActive: false,
		engineToggling: false,

		engineOptions: {},
		engineData: {},
	}),

	methods: {
		async pickNewMedia() {
			console.log("Picking new media");

			this.selectingMedia = true;

			await Content.promptPickNewMedia();
			console.log("New media selected");

			this.engineMediaSelected = true;
			this.selectingMedia = false;
		},

		async setOptions() {
			await Content.setEngineOptions(this.engineOptions);
		},

		async toggleEngine() {
			this.engineToggling = true;

			if (!this.engineActive) {
				await Content.startEngine();
			} else {
				await Content.stopEngine();
			}

			this.engineToggling = false;
			this.engineActive = !this.engineActive;
		},

		ampFromDbfs: ExtremaAnalyser.ampFromDbfs,
		dbfsFromAmp: ExtremaAnalyser.dbfsFromAmp,
	},

	async created() {
		Content = await contentScriptPromise;

		await Promise.all([
			Content.getEngineOptions().then(engineOptions => {
				this.engineOptions = engineOptions;
				this.engineOptionsLoaded = true;
			}),
			Content.getEngineData().then(engineData => {
				this.engineData = engineData;
				this.engineMediaSelected = engineData.mediaSelected;
				this.selectingMedia = engineData.selectingMedia;
				this.engineActive = engineData.active;
			}),
		]);
	},

	async mounted() {
		await contentScriptPromise;

		const updateEngineData = async () => {
			this.engineData = await Content.getEngineData();
			requestAnimationFrame(updateEngineData);
		};
		requestAnimationFrame(updateEngineData);
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