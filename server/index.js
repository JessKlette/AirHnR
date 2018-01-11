const config = require('../config');
const db = require('../database');
const express = require('express');
const app = express();
const bodyParser = require('body-parser')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use(express.static(__dirname + '/../client/dist'));
app.use(express.json());


app.post('/search', function(req, res){
  res.send(req.body)
})

app.get('/api/listings', function(req, res){
    console.log(req.query)
    res.json("Hello")

})

app.get('/api/listing', function(req, res){
    console.log(req.query)
    res.json("Hello")

})

app.post('/api/bookings', (req, res) => {
  console.log(req.body);
  res.send('ok');
});
app.listen(config.serverPort, () => {
  console.log(`Server listening on port ${config.serverPort}`)
});
