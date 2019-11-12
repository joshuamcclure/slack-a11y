const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const { isValidUrl, scan, response, sendResponse } = require('./utils');
const { PORT } = process.env;

const server = express();

const port = PORT || 4117;

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

server.use(morgan('combined', { stream: accessLogStream }));
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

server.use('/captures', express.static('captures'));

const delayedResponse = async (url, requestBody) => {
	setTimeout( async () => {
		const results = await scan(url);
		const responseBody = response(url, results);
		sendResponse(requestBody, responseBody);
	}, 0);
};

server.get('/', (req, res, next) => {
	res.json({ msg: 'The Slack-A11y API seems to be operating.' });
});

server.post('/', async (req, res, next) => {
	const pageUrl = req.body.text;

	if ( isValidUrl(pageUrl) ) {
		res.json({
			"response_type": "ephemeral",
			"text": `Analyzing ${pageUrl}. Please wait!`
		});
	
		delayedResponse(pageUrl, req.body);
	} else {
		res.json({
			"response_type": "ephemeral",
			"text": `${pageUrl} doesn't seem to be a valid url. Try something else!`
		});
	}
});

server.post('/direct', async (req, res, next) => {
	const pageUrl = req.body.url;
	const results = await scan(pageUrl);
	res.json({
		"URL": pageUrl,
		"results": results,
	});
});

server.listen(port, () => {
	console.log(`Server started at localhost:${port}`)
});