const axios = require('axios')
const checkApiKey = require('../../../cekapikey.js')

module.exports = function(app) {
  app.get('/api/search/npm', checkApiKey, async (req, res) => {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ status: false, error: 'Query is required' });
    }
    try {
      const npmmres = await axios.get(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(q)}&size=10`);
      const npmres = npmmres.data.objects.map(pkg => ({
        name: pkg.package.name,
        version: pkg.package.version,
        description: pkg.package.description,
        date: pkg.package.date,
        link: pkg.package.links.npm,
        github: pkg.package.links.repository || null
      }))
      res.status(200).json({
        status: true,
        result: npmres
      });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  })
}
