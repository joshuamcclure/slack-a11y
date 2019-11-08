const express = require('express');
const logger = require('morgan');
const { isValidUrl, scan, response, sendResponse } = require('./utils');
const { PORT } = process.env;

const server = express();

const port = PORT || 80;

server.use(logger('dev'));
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

const delayedResponse = async (url, requestBody) => {
	setTimeout( async () => {
		const results = await scan(url);
		sendResponse(requestBody, response(url, results));
	}, 0);
};

server.get('/', (req, res, next) => {
	res.json({ msg: 'Hello world!' });
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

server.listen(port, () => {
	console.log(`Server started at localhost:${port}`)
});