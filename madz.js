const fs = require('fs')
const path = require('path')
const cors = require('cors')
const express = require('express');

const app = express()
const PORT = process.env.PORT || 8080 || 5000 || 3000;

app.enable("trust proxy");
app.set("json spaces", 2);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors())
app.use(express.static(path.join(__dirname, 'public')));
app.use('/src', express.static(path.join(__dirname, 'src')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'madzweb.html'))
})

app.get('/restapi', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'madzapi.html'))
})

app.get('/store', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'madzstore.html'))
})

app.listen(PORT, () => {
  console.log(`Server aktif di http://localhost:${PORT}`);
});