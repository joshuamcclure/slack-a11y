const puppeteer = require('puppeteer');
const axe = require('axe-core');
const fetch = require('node-fetch');
const URL = require("url").URL;

const addAxeScript = async (frame) => {
	await frame.addScriptTag({ content: axe.source });
	for (let child of frame.childFrames()) {
		await addAxeScript(child);
	}
}

const isValidUrl = (s) => {
	try {
		new URL(s);
		return true;
	} catch (err) {
		return false;
	}
};

const scan = async (domain) => {
	try {
		const browser = await puppeteer.launch();
		const page = await browser.newPage();
	
		await page.goto(domain);
		await addAxeScript(page.mainFrame());
	
        const results = await page.evaluate(async () => await axe.run({ reporter: "v2" }));

        await browser.close();

        return results;
	} catch (error) {
        await browser.close();
        return false;
	}
};

const response = (url, results) => {
	if ( results ) {
		return {
			"blocks": [
				{
					"type": "section",
					"text": {
						"type": "mrkdwn",
						"text": `*Scan Results for <${url}>*\n- ${results.violations.length} violations found\n- ${results.passes.length} passing checkpoints`
					}
				},
			]
		};
	} else {
		return {
			"blocks": [
				{
					"type": "ephemeral",
					"text": {
						"type": "mrkdwn",
						"text": `Oops! there was an error. Try again later.`
					}
				},
			]
		};
	}
};

const sendResponse = (slackParams, response) => {
	fetch(slackParams.response_url, { method: 'POST', body: JSON.stringify(response) })
		.then(res => res.json())
		.then(json => console.log(json));
};

module.exports = {
	isValidUrl,
	scan,
	response,
	sendResponse,
};