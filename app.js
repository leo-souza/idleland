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
  ///
  game.init(io);
});

io.on('connection', function(client) {
  //Generate a new UUID, looks something like
  //5b2ca132-64bd-4513-99da-90e838ca47d1
  //and store this on their socket/connection
  client.userid = util.uuid();

  client.on('user-connect', function(data){
    var newplayer = game.newPlayer(client.userid, data);
    client.emit('user-enter', {player: newplayer, uid: client.userid, players: game.players, items: game.items});
    game.players.push(newplayer);
    io.emit('user-join', {uid: client.userid, player: newplayer, players: game.players});
  });

  client.on('disconnect', function () {
    var del = game.findPlayerIdx(client.userid);
    if (del > -1){
      var player = game.players[del];
      game.players.splice(del, 1);
      io.emit('user-exit', {uid: client.userid, player: player, players: game.players});
    }
  });

  client.on('user-cmd', function(data){
    var idx = game.findPlayerIdx(data.uid);
    if (idx > -1){
      if (data.cmd == 'name') {
        game.players[idx].name = data.value;
      }
    }
    io.emit('update', {players: game.players});
  });

  client.on('user-message', function(data){
    var idx = game.findPlayerIdx(data.uid);
    if (idx > -1){
      game.players[idx].message = data.message;
    }
    io.emit('update', data);
  });

  client.on('user-stop', function(data){
    var idx = game.findPlayerIdx(data.uid);
    if (idx > -1){
      game.players[idx].moving = false;
    }
    io.emit('other-stop', data);
  });

  client.on('user-moving', function(data){
    var idx = game.findPlayerIdx(data.uid);
    if (idx > -1){
      game.players[idx].moving = true;
      game.players[idx].x = data.x;
      game.players[idx].y = data.y;
      game.players[idx].dir = data.dir;
    }
  });

  client.on('got-item', function(data){
    for(var j = 0; j<game.items.length; j++){
      if (game.items[j].uid == data.item_uid){
        var p = game.items[j];
        client.emit('user-powerup', {effect: p.effect});
        io.emit('item-gone', {item_uid: data.item_uid});
        game.items.splice(j, 1);
        break;
      }
    }
  });
});
