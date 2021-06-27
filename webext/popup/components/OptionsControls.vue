<template>
	<options-controls @input="setOptions">
		<table>
			<tr>
				<th>Loudness threshold (<abbr title="decibels, relative to maximum amplitude">dBFS</abbr>)</th>
				<td>
					<input type="range" min="0" max="1" step="any"/>
					<input type="text" v-model.number="engineOptions.thresholdAmp" />

					{{thresholdDbfs}}
				</td>
			</tr>
			<tr>
				<th>Loud playback speed</th>
				<td>
					<input type="range" min="-2" max="2" step="any" />
					<input type="text" v-model.number="engineOptions.loudSpeed" />
				</td>
			</tr>
			<tr>
				<th>Quiet playback speed</th>
				<td>
					<input type="range" min="-2" max="2" step="any" />
					<input type="text" v-model.number="engineOptions.softSpeed" />
				</td>
			</tr>
		</table>
	</options-controls>
</template>

<script>
import contentScriptPromise from "../ContentComm.js";
import ExtremaAnalyser from "@lib/volume-calc/ExtremaAnalyser.js";

let Content;

export default {
	name: "optionscontrols",
	
	data: () => ({
		engineOptionsLoaded: false,

		engineOptions: null,
	}),

	methods: {
		async setOptions() {
			await Content.setEngineOptions(this.engineOptions);

			console.log(await Content.getEngineOptions());
		},
	},

	computed: {
		thresholdDbfs() {
			return ExtremaAnalyser.dbfsFromAmp(this.engineOptions.thresholdAmp);
		},
	},

	async created() {
		Content = await contentScriptPromise;
		this.engineOptions = await Content.getEngineOptions();

		this.engineOptionsLoaded = true;
	},
};
</script>
