<template>
	<options-controls @input="setOptions">
		<button id="pick-new-media" @click="pickNewMedia">Select media</button>

		<table>
			<tr>
				<th>Loudness threshold (<abbr title="decibels, relative to maximum amplitude">dBFS</abbr>)</th>
				<td>
					<Slider v-model="engineOptions.thresholdAmp" />
					<Entry v-model="engineOptions.thresholdAmp"
							:convertIn="dbfsFromAmp"
							:convertOut="ampFromDbfs"
							:validate="value => 0 <= value && value <= 1" />
				</td>
			</tr>
			<tr>
				<th>Loud playback speed</th>
				<td>
					<Slider v-model="engineOptions.loudSpeed"
							:minValue="-2"
							:maxValue="2"
							:convertIn="trueValue => Math.log2(trueValue)"
							:convertOut="displayValue => 2 ** displayValue" />
					<Entry v-model="engineOptions.loudSpeed"
							:validate="value => 1/4 <= value && value <= 4" />
				</td>
			</tr>
			<tr>
				<th>Quiet playback speed</th>
				<td>
					<Slider v-model="engineOptions.softSpeed"
							:minValue="-2"
							:maxValue="2"
							:convertIn="trueValue => Math.log2(trueValue)"
							:convertOut="displayValue => 2 ** displayValue" />
					<Entry v-model="engineOptions.softSpeed"
							:validate="value => 1/4 <= value && value <= 4" />
				</td>
			</tr>
		</table>

		<button @click="toggleEngine" :disabled="!engineMediaSelected || engineToggling">{{engineActive ? "❚❚ Stop tracking" : "▶ Start tracking"}}</button>

		<table>
			<tr>
				<th>Greatest captured loudness (<abbr title="decibels, relative to maximum amplitude">dBFS</abbr>)</th>
				<td>{{dbfsFromAmp(engineData.lastMaxAmp)}}</td>
			</tr>
		</table>
	</options-controls>
</template>

<script>
import contentScriptPromise from "../ContentComm.js";
import ExtremaAnalyser from "@lib/volume-calc/ExtremaAnalyser.js";
import Entry from "./input/Entry.vue";
import Slider from "./input/Slider.vue";

let Content;

export default {
	name: "optionscontrols",
	
	data: () => ({
		engineOptionsLoaded: false,
		engineMediaSelected: false,
		engineActive: false,
		engineToggling: false,

		engineOptions: null,
		engineData: null,
	}),

	methods: {
		async pickNewMedia() {
			console.log("Picking new media");

			await Content.promptPickNewMedia();
			console.log("New media selected");

			this.engineMediaSelected = true;
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
				this.engineActive = engineData.active;
			}),
		]);
	},

	async mounted() {
		await contentScriptPromise;

		const updateDataTable = async () => {
			this.engineData = await Content.getEngineData();
			requestAnimationFrame(updateDataTable);
		};
		requestAnimationFrame(updateDataTable);
	},

	components: {
		Entry,
		Slider,
	},
};
</script>

<style scoped>
options-controls {
	display: block;
}
</style>
