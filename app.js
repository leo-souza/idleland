// app.js
var express = require('express');
var exphbs  = require('express-handlebars');
var routes = require('./routes');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var util = require('./util.js');
var game = require('./game.js');

//Environment vars
app.set('port', process.env.PORT || 3001);
app.set('views', (__dirname + '/views'));
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(express.static('public'));

//Routes
app.get('/', routes.index);

//Start the server
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

io.on('connection', function(client) {
  //Generate a new UUID, looks something like
  //5b2ca132-64bd-4513-99da-90e838ca47d1
  //and store this on their socket/connection
  client.userid = util.uuid();

  client.on('user-connect', function(data){
    var item = {}
    data.player.uid = client.userid;
    item[client.userid] = data.player;
    client.emit('user-enter', { player: data.player, uid: client.userid, players: game.players, boxes: game.boxes } );
    game.players.push(item);
    io.emit('user-join', {uid: client.userid, player: data.player, players: game.players});
  });

  client.on('disconnect', function () {
    for (var i = 0; i < game.players.length; i++) {
      if(Object.keys(game.players[i])[0] == client.userid){
        var playr = game.players[i][client.userid];
        game.players.splice(i, 1);
        io.emit('user-exit', {message: client.userid+' has left the arena', uid: client.userid, player: playr, players: game.players});
        break;
      }
    }
  });

  client.on('user-cmd', function(data){
    for (var i = 0; i < game.players.length; i++) {
      if(Object.keys(game.players[i])[0] == data.uid){
        if (data.cmd == 'name') {
          game.players[i][data.uid].name = data.value;
        }
      }
    }
    io.emit('update', {players: game.players});
  });

  client.on('user-message', function(data){
    for (var i = 0; i < game.players.length; i++) {
      if(Object.keys(game.players[i])[0] == data.uid){
        game.players[i][data.uid].message = data.message;
      }
    }
    io.emit('update', data);
  });

  client.on('user-moving', function(data){
    for (var i = 0; i < game.players.length; i++) {
      if(Object.keys(game.players[i])[0] == data.player.uid){
        game.players[i][data.player.uid] = data.player;
      }
    }
    io.emit('update', data);
  });
});
