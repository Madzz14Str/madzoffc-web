const axios = require('axios')
const checkApiKey = require('../../../cekapikey.js')
const { getZipUrl, downloadZip } = require('../../scrape/scrape1.js')

module.exports = function(app) {
  app.get('/api/downloader/gitclone', checkApiKey, async (req, res) => {
    const { link, branch = 'main', mode = 'json' } = req.query;
    if (!link) {
      return res.status(400).json({ status: false, error: 'Link is required' });
    }
    try {
      const [zipUrl, slug] = getZipUrl(link, branch);

      /* 🔄 opsi 1 : redirect langsung */
      if (mode.toLowerCase() === 'redirect')
        return res.redirect(zipUrl);

      /* 🔄 opsi 2 : stream file (jika butuh) */
      if (mode.toLowerCase() === 'file') {
        const { filePath } = await downloadZip(link, branch);
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition',
          `attachment; filename="${slug.split('/')[1]}-${branch}.zip"`);

        return require('fs').createReadStream(filePath)
          .pipe(res)
          .on('close', () => require('fs').unlink(filePath, () => {}));
      }
      return res.status(200).json({
        status : true,
        result : {
          repo         : slug,      
          branch,
          download_url : zipUrl
        }
      });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  })
}
