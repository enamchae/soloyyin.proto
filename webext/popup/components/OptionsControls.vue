<template>
	<options-controls @input="setOptions">
		<table>
			<tr>
				<th>Loudness threshold (<abbr title="decibels, relative to maximum amplitude">dBFS</abbr>)</th>
				<td>
					<input type="range" min="0" max="1" step="any"/>
					<ValidatorInput
							v-model="engineOptions.thresholdAmp"
							:convertIn="dbfsFromAmp"
							:convertOut="ampFromDbfs"
							:validate="value => 0 <= value && value <= 1" />

					{{thresholdDbfs}}
				</td>
			</tr>
			<tr>
				<th>Loud playback speed</th>
				<td>
					<input type="range" min="-2" max="2" step="any" />
					<ValidatorInput
							v-model="engineOptions.loudSpeed"
							:validate="value => 1/4 <= value && value <= 4" />
				</td>
			</tr>
			<tr>
				<th>Quiet playback speed</th>
				<td>
					<input type="range" min="-2" max="2" step="any" />
					<ValidatorInput
							v-model="engineOptions.softSpeed"
							:validate="value => 1/4 <= value && value <= 4" />
				</td>
			</tr>
		</table>

	</options-controls>
</template>

<script>
import contentScriptPromise from "../ContentComm.js";
import ExtremaAnalyser from "@lib/volume-calc/ExtremaAnalyser.js";
import ValidatorInput from "./ValidatorInput.vue";

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

		ampFromDbfs: ExtremaAnalyser.ampFromDbfs,
		dbfsFromAmp: ExtremaAnalyser.dbfsFromAmp,
	},

	computed: {
		thresholdDbfs() {
			return ExtremaAnalyser.dbfsFromAmp(this.engineOptions?.thresholdAmp ?? 0);
		},
	},

	async created() {
		Content = await contentScriptPromise;
		this.engineOptions = await Content.getEngineOptions();

		this.engineOptionsLoaded = true;
	},

	components: {
		ValidatorInput,
	},
};
</script>
