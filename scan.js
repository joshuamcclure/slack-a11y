const { scan, response, sendResponse } = require('./utils');

const performScan = async (url, requestBody) => {
    requestBody = JSON.parse(requestBody);
    const results = await scan(url);
    const responseBody = response(url, results);
    // sendResponse(requestBody, responseBody);
    console.log(responseBody);
}

performScan(process.argv[2], process.argv[3]);