const axios = require('axios')
const checkApiKey = require('../../../cekapikey.js')
const { mediafireDl } = require('../../scrape/scrape1.js')

module.exports = function(app) {
  app.get('/api/downloader/mediafire', checkApiKey, async (req, res) => {
    const { link } = req.query;
    if (!link) {
      return res.status(400).json({ status: false, error: 'Link is required' });
    }
    try {
      const info = await mediafireDl(link)
      return res.status(200).json({
        status : true,
        result : info
      });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  })
}
