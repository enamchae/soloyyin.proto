<template>
	<options-controls @input="setOptions">
		<table>
			<tr>
				<th>Loudness threshold (<abbr title="decibels, relative to maximum amplitude">dBFS</abbr>)</th>
				<td>
					<input type="range" min="0" max="1" step="any"/>
					<input type="text" :value="dbfsFromAmp(engineOptions.thresholdAmp)" @input="setThresholdAmp" />

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

		<ValidatorInput :validate="value => value < 20" :initialValue="-5" />
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

		dbfsFromAmp: ExtremaAnalyser.dbfsFromAmp,

		setThresholdAmp(event) {
			this.engineOptions.thresholdAmp = ExtremaAnalyser.ampFromDbfs(Number(event.currentTarget.value));
		},
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
