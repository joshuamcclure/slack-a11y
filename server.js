const express = require('express');
const logger = require('morgan');
const { scan, response, sendResponse } = require('./utils');
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
	delayedResponse();
});

server.post('/', async (req, res, next) => {
	console.log(req.body);
	const url = req.body.text;
	// const results = await scan(url);
	// res.json( response(url, results) );
	res.json({
		"response_type": "ephemeral",
		"text": `Analyzing ${url}. Please wait!`
	});

	delayedResponse(url, req.body);
});

server.listen(port, () => {
	console.log(`Server started at localhost:${port}`)
});