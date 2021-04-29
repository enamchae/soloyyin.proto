(async () => {
	const tab = (await browser.tabs.query({active: true, currentWindow: true}))[0];

	await browser.tabs.executeScript({file: "/content.js"});

	document.querySelector("#pick-new-media").addEventListener("click", async () => {
		console.log(tab);
		browser.tabs.sendMessage(tab.id, "pick-new-media");
	});
})();