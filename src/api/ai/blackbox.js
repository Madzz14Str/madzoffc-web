const axios = require('axios');
const checkApiKey = require('../../../cekapikey.js')
const { blackbox } = require('../../../src/scrape/scrape2.js')
module.exports = function(app) {
    app.get('/api/ai/blackbox', checkApiKey, async (req, res) => {
        try {
            const { text } = req.query;
            if (!text) {
                return res.status(400).json({ status: false, error: 'Text is required' });
            }
            const res = await blackbox(text);
            res.status(200).json({
                status: true,
                result: res
            });
        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
};