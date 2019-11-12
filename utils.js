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

async function timeout(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

const scan = async (domain) => {
	try {
		const browser = await puppeteer.launch({
			headless: false,
			args: [`--window-size=1400,960`],
		});
		const page = await browser.newPage();

		await page.setViewport({width:1400, height:960});
	
		await page.goto(domain, {
			waitUntil: 'networkidle0',
		});

		await addAxeScript(page.mainFrame());
		
		await autoScroll(page);
		await timeout(5000);

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
		.then( res => true )
		.catch( err => true );
};

module.exports = {
	isValidUrl,
	scan,
	response,
	sendResponse,
};