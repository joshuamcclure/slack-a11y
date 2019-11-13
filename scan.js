const { scan, response, sendResponse } = require('./utils');

(async () => {
    try {
        const url = process.argv[2];
        const requestBody = JSON.parse(process.argv[3]);
        const results = await scan(url);
        const responseBody = response(url, results);
        
        sendResponse(requestBody, responseBody);
    } catch(e) {
        console.log(e);
    }
})()