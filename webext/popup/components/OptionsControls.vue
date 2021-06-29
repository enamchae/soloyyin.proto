<template>
	<options-controls @input="setOptions">
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
import Entry from "./Entry.vue";
import Slider from "./Slider.vue";

let Content;

export default {
	name: "optionscontrols",
	
	data: () => ({
		engineOptionsLoaded: false,

		engineOptions: null,
		engineData: null,
	}),

	methods: {
		async setOptions() {
			await Content.setEngineOptions(this.engineOptions);
		},

		ampFromDbfs: ExtremaAnalyser.ampFromDbfs,
		dbfsFromAmp: ExtremaAnalyser.dbfsFromAmp,
	},

	async created() {
		Content = await contentScriptPromise;
		this.engineOptions = await Content.getEngineOptions();

		this.engineOptionsLoaded = true;
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
