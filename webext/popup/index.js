(async () => {
	const tab = (await browser.tabs.query({active: true, currentWindow: true}))[0];

	document.querySelector("#pick-new-media").addEventListener("click", async () => {
		browser.tabs.sendMessage(tab.id, "pick-new-media");
	});
})();