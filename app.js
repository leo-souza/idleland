// app.js
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var path = require('path');
//
var game = require('./app/game.js');

//Environment vars
app.set('port', process.env.PORT || 3001);
// public files
app.use(express.static('public'));

//Routes
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

//Start the server
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
  // init game
  game.init(io);
});
