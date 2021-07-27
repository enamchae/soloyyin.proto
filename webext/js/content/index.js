import browser from "webextension-polyfill";

console.log("hello");
const popup = open(browser.runtime.getURL("./content/ui/index.html"), "", "_");