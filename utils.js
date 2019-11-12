const puppeteer = require('puppeteer');
const axe = require('axe-core');
const fetch = require('node-fetch');
const URL = require("url").URL;
const uuidv4 = require('uuid/v4');

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
	let results = null;

	const browser = await puppeteer.launch({
		headless: process.env.HEADLESS || true,
		args: [`--window-size=1400,960`],
	});

	try {
		const page = await browser.newPage();

		page.on('pageerror', async err => {
			let theErr = err.toString();
			if ( theErr && theErr.search('axe is not defined') ) {
				results = 'Axe not defined';
				await browser.close();
			}
		});

		await page.setViewport({width:1400, height:960});
	
		await page.goto(domain, {waitUntil: 'networkidle0'});

		await addAxeScript(page.mainFrame());

		const capturePath = `captures/${uuidv4()}.png`;
		await page.screenshot({path: capturePath});
		
		await autoScroll(page);
		await timeout(5000);

		results = await page.evaluate(async () => await axe.run({ reporter: "v2" }));

		return {
			results,
			screenCapture: capturePath,
		};
		
	} catch (error) {
        return 'There was an error. This site may be blocking the axe script injection. Please use the axe browser extension.';
	}

	finally {
		await browser.close();
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
						"text": `*Scan Results for <${url}>*\n- ${results.results.violations.length} violations found\n- ${results.results.incomplete.length} issues that need review\n- ${results.results.passes.length} passing checkpoints`
					}
				},{
					"type": "image",
					"title": {
						"type": "plain_text",
						"text": `A screen capture of the webpage - ${url}`,
						"emoji": true
					},
					"image_url": `http://159.203.179.0:4117/${results.screenCapture}`,
					"alt_text": `A screen capture of the webpage - ${url}`
				}
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