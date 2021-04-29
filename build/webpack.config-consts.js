export default {
	mode: process.env.NODE_ENV,
	devtool: process.env.NODE_ENV === "development" ? "cheap-source-map" : false,
	resolve: {
		alias: {
			"@lib": "/lib",
		},
	},
};