"use strict";

const userPickNewMedia = () => {
	return new Promise(resolve => {
		const onclick = event => {
			const elements = document.elementsFromPoint(event.pageX, event.pageY);

			for (const element of elements) {
				if (!(element instanceof HTMLMediaElement)) continue;

				removeEventListener("click", onclick);

				resolve(element);
				break;
			}
		};

		addEventListener("click", onclick);
	});
};

browser.runtime.onMessage.addListener(async (message, sender) => {
	switch (message) {
		case "pick-new-media":
			const media = await userPickNewMedia();
			console.log(media);
			break;

		default:
			throw new TypeError();
	}
});