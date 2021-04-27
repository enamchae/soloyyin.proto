export default {
	mode: "production",
	devtool: process.env.NODE_ENV === "development" ? "source-map" : false,
	resolve: {
		alias: {
			"@lib": "/lib",
		},
	},
};