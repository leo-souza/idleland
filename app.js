// app.js
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var path = require('path');
//
var util = require('./app/util.js');
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

///// socket events
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

  client.on('user-throw', function(data){
    //game.throws.push(data);
    client.broadcast.emit('other-throw', data);
  });

  client.on('user-hit', function(data) {
    var plyr = game.findPlayerIdx(client.userid);
    if (plyr > -1){
      var player = game.players[plyr];
      if (player.hp > 0) player.hp -= 15;
      if (player.hp <= 0) {
        client.emit('player-dead', {});
        /// TODO backend handle death
      }
    }
    io.emit('update', {players: game.players});
    return false;
  });

  client.on('user-move', function(data){
    var idx = game.findPlayerIdx(data.uid);
    if (idx > -1){
      if (data.dir) {
        game.players[idx].moving = true;
        game.players[idx].x = data.x;
        game.players[idx].y = data.y;
        game.players[idx].dir = data.dir;
      }else{
        game.players[idx].moving = false;
        game.players[idx].x = data.x;
        game.players[idx].y = data.y;
        game.players[idx].dir = '';
      }
    }
    client.broadcast.emit('other-move', data);
  });

  client.on('got-item', function(data) {
    game.items.forEach(function(item, idx) {
      if (item.uid == data.item_uid) {
        client.emit('item-got', item);
        client.broadcast.emit('item-gone', item);
        game.items.splice(idx, 1);
        ///
        var plyr = game.findPlayerIdx(client.userid);
        if (plyr > -1){
          var player = game.players[plyr];
          player.points += item.points;
        }
        io.emit('update', {players: game.players});
        return false;
      }
    });
  });
});
