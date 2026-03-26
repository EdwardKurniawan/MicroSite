const http = require('http');

const data = JSON.stringify({
  prompt: "What should I do for 1 day in Kanazawa?",
  city: "kanazawa"
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/search?city=kanazawa',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (d) => body += d);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
        const json = JSON.parse(body);
        console.log('Summary:', json.summary);
        console.log('Steps:', json.steps.length);
        if (json.steps.length > 0) {
            console.log('Sample Step:', JSON.stringify(json.steps[0], null, 2));
        }
    } catch (e) {
        console.log('Body:', body);
    }
  });
});

req.on('error', (e) => {
  console.error('Problem with request:', e.message);
});

req.write(data);
req.end();
