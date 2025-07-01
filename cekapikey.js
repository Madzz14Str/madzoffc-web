// middleware/checkKey.js
const fs   = require('fs');
const path = require('path');

// 1) Baca file JSON (sekali saja saat server start)
const config = JSON.parse(
  fs.readFileSync(path.join(__dirname, './src/settings.json'), 'utf-8')
);

// 2) Ambil array key
const validKeys = config.apiSettings.apikey;    

// 3) Middleware
function checkApiKey(req, res, next) {
  const apiKey = req.header('x-api-key') || req.query.apikey;

  if (!apiKey) {
    return res.status(401).json({ status:false, error:'API key missing' });
  }
  if (!validKeys.includes(apiKey)) {
    return res.status(403).json({ status:false, error:'API key invalid' });
  }
  next();
}

module.exports = checkApiKey;