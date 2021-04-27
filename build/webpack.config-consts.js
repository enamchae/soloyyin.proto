export default {
	mode: process.env.NODE_ENV,
	devtool: process.env.NODE_ENV === "development" ? "eval" : false,
	resolve: {
		alias: {
			"@lib": "/lib",
		},
	},
};