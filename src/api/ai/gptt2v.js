/**
    @ ✨ Scrape GPT Text To Video
    @ Base: https://play.google.com/store/apps/details?id=ai.video.generator.text.video
**/

const axios = require('axios');
const checkApiKey = require('../../../cekapikey.js')

module.exports = function(app) {
  async function gptt2vid(prompt) {
    try {
      const { data: k } = await axios.post('https://soli.aritek.app/txt2videov3', {
        deviceID: Math.random().toString(16).substr(2, 8) + Math.random().toString(16).substr(2, 8),
        prompt: prompt,
        used: [],
        versionCode: 51
      }, {
        headers: {
          authorization: 'eyJzdWIiwsdeOiIyMzQyZmczNHJ0MzR0weMzQiLCJuYW1lIjorwiSm9objMdf0NTM0NT',
                'content-type': 'application/json; charset=utf-8',
                'accept-encoding': 'gzip',
                'user-agent': 'okhttp/4.11.0'
        }
      });
      const { data } = await axios.post('https://soli.aritek.app/video', {
            keys: [k.key]
      }, {
        headers: {
          authorization: 'eyJzdWIiwsdeOiIyMzQyZmczNHJ0MzR0weMzQiLCJuYW1lIjorwiSm9objMdf0NTM0NT',
                'content-type': 'application/json; charset=utf-8',
                'accept-encoding': 'gzip',
                'user-agent': 'okhttp/4.11.0'
        }
      });
      return data.datas[0].url;
    } catch (error) {
      console.error(error.message);
      throw new Error('No result found');
    }
  }
  
  app.get('/api/ai/gpttovid', checkApiKey, async (req, res) => {
    try {
      const { text } = req.query
      if(!text) {
        return res.status(400).json({ status: false, error: 'Text is required' });
      }
      const gpt = await gptt2vid(text);
            res.status(200).json({
                status: true,
                video: gpt
            });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  })
}
