export default {
	mode: process.env.NODE_ENV,
	// "eval-source-map" as workaround so that Chromium can load sourcemaps (https://stackoverflow.com/questions/54669476/chrome-72-changes-sourcemap-behaviour)
	devtool: process.env.NODE_ENV === "development" ? "eval-source-map" /* "cheap-source-map" */ : false,
	resolve: {
		alias: {
			"@lib": "/lib",
		},
	},

/* 	cache: {
		type: "filesystem",
	}, */
};