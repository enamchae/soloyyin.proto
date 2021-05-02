(async () => {
	const tab = (await browser.tabs.query({active: true, currentWindow: true}))[0];
	console.log(tab);

	const contentScriptLoaded = async () => {
		// is there a better way to do this
		try {
			await browser.tabs.sendMessage(tab.id, "ping");
			return true;
		} catch (error) {
			return false;
		}
	};
	
	const loadContentScriptIfUnloaded = async () => {
		if (await contentScriptLoaded()) {
			console.log("Content script already loaded");
		} else {
			console.log("Content script now loading");
			await browser.tabs.executeScript({file: "/content.js"});
			console.log("Content script done loading!");
		}
	};
	
	await loadContentScriptIfUnloaded();

	document.querySelector("#pick-new-media").addEventListener("click", async () => {
		console.log(await browser.tabs.sendMessage(tab.id, "pick-new-media"));
	});
})();