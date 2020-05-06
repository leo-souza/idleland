const util = require('./util.js');
const fs = require('fs');
const database = require('./database.js');

module.exports = new function(){

  //// Attributes

  var public = this;
  var spawns = [
    {x: 410,  y: 115},
    {x: 1140, y: 935},
    {x: 1710, y: 3035},
    {x: 140,  y: 2920},
    {x: 2645, y: 3015},
    {x: 2916, y: 1480}
  ];
  var itemPositions = [];
  var regularSpeed = 300;
  var itemPoints = [100, 250, 500];
  var itemEffects = [['speed', 450], ['scale', 2], ['scale', 0.5]];
  var itemTypes = ['carrot', 'meat', 'fish', 'orange', 'grape','apple',
                  'bread', 'egg', 'cheese', 'bag', 'brocolli', 'tomato'];

  //// Private

  var getSpawnPos = function(){
    return spawns[Math.floor(Math.random()*spawns.length)];
  };
  var getItemPos = function(){
    return itemPositions[Math.floor(Math.random()*itemPositions.length)];
  }
  var rndItemType = function(){
    return itemTypes[Math.floor(Math.random()*itemTypes.length)]
  };
  var rndItemPoint = function(){
    return itemPoints[Math.floor(Math.random()*itemPoints.length)]
  };
  var rndItemEffect = function(){
    return itemEffects[Math.floor(Math.random()*itemEffects.length)]
  };

  /// Database related functions
  var newPlayer = function(uid, attrs){
    var spawn = getSpawnPos();
    return {
      uid: uid,
      is_alive: true,
      hp: 1000,
      points: 0,
      x: spawn.x,
      y: spawn.y,
      name: attrs.name,
      color: attrs.color,
      moving: false,
      speed: regularSpeed,
      scale: 1,
      kills: 0,
      deaths: 0,
      dir: ''
    };
  };

  var resetPlayer = function(attrs){
    var spawn = getSpawnPos();
    attrs.is_alive = true;
    attrs.hp = 1000;
    attrs.points = 0;
    attrs.x = spawn.x;
    attrs.y = spawn.y;
    attrs.moving = false;
    attrs.speed = regularSpeed;
    attrs.scale = 1;
    attrs.dir = '';
  };

  var addPlayer = function(attrs)  {
    return database.create('player', attrs);
  }

  var savePlayer = function(attrs)  {
    return database.update('player', attrs);
  }

  var findPlayer = function(uid)  {
    return database.find('player', uid);
  }

  var destroyPlayer = function(attrs)  {
    return database.destroy('player', attrs.uid);
  }

  var getPlayers = function()  {
    var players = database.findAll('player');
    return players.filter(function(pl){
      return pl.is_alive;
    });
  }

  var findItem = function(uid)  {
    return database.find('item', uid);
  }

  var destroyItem = function(attrs)  {
    return database.destroy('item', attrs.uid);
  }

  var getItems = function()  {
    return database.findAll('item');
  }

  var createGrave = function(grave) {
    return database.create('grave', grave);
  }

  var getGraves = function() {
    return database.findAll('grave');
  }

  //// socket event handlers
  var initSocket = function(socket) {
    ///// socket events
    socket.on('connection', function(client) {
      //Generate a new UUID, looks something like
      //5b2ca132-64bd-4513-99da-90e838ca47d1
      //and store this on their socket/connection
      client.userid = util.uuid();

      client.on('user-connect', function(data){
        var newplayer = newPlayer(client.userid, data);
        client.emit('user-enter', {player: newplayer, players: getPlayers(), items: getItems(), graves: getGraves()});
        addPlayer(newplayer);
        socket.emit('user-join', {player: newplayer, players: getPlayers()});
      });

      client.on('user-reconnect', function(){
        var player = findPlayer(client.userid);
        resetPlayer(player);
        savePlayer(player);
        client.emit('user-reenter', {player: player});
        socket.emit('user-join', {player: player, players: getPlayers()});
      });

      client.on('disconnect', function () {
        var del = findPlayer(client.userid);
        if (del){
          destroyPlayer(del)
          socket.emit('user-exit', {player: del, players: getPlayers()});
        }
      });

      client.on('user-cmd', function(data){
        var player = findPlayer(data.uid);
        if (player){
          if (data.cmd == 'name') {
            player.name = data.value;
            savePlayer(player);
          }
        }
        socket.emit('update', {players: getPlayers()});
      });

      client.on('user-message', function(data){
        var player = findPlayer(data.uid);
        if (player){
          player.last_message = data.message;
          player.last_message_at = Date.now();
          savePlayer(player);
        }
        socket.emit('message-sent', data);
      });

      client.on('user-throw', function(data){
        //throws.push(data);
        client.broadcast.emit('other-throw', data);
      });

      client.on('user-hit', function(data) {
        var player = findPlayer(client.userid);
        if (player){
          if (player.hp > 0) player.hp -= 20;
          if (player.hp <= 0) {
            var hitter = findPlayer(data.hit_by);
            hitter.kills += 1;
            savePlayer(hitter);
            player.deaths += 1;
            player.is_alive = false;
            savePlayer(player);
            var grave = createGrave({uid: util.uuid(), killer: hitter, dead: player});
            client.emit('player-dead', {grave: grave});
            socket.emit('user-exit', {player: player, players: getPlayers(), dead: true, grave: grave});
          } else {
            savePlayer(player);
          }
        }
        socket.emit('update', {players: getPlayers()});
      });

      client.on('user-move', function(data){
        var player = findPlayer(data.uid);
        if (player){
          if (data.dir) {
            player.moving = true;
            player.x = data.x;
            player.y = data.y;
            player.dir = data.dir;
          }else{
            player.moving = false;
            player.x = data.x;
            player.y = data.y;
            //player.dir = '';
          }
          savePlayer(player);
        }
        client.broadcast.emit('other-move', data);
      });

      client.on('got-item', function(data) {
        var item = findItem(data.item_uid);
        var player = findPlayer(client.userid);
        if (item && player) {
          client.broadcast.emit('item-gone', item);
          destroyItem(item);
          ///
          player.points += item.points;
          if (item.effect[0] == 'speed'){
            player.speed = item.effect[1];
          } else if (item.effect[0] == 'scale'){
            player.scale = item.effect[1];
          }
          savePlayer(player);
          socket.emit('update', {players: getPlayers()});
          setTimeout(function(){
            if (item.effect[0] == 'speed'){
              player.speed = regularSpeed;
            } else if (item.effect[0] == 'scale'){
              player.scale = 1
            }
            savePlayer(player);
            socket.emit('update', {players: getPlayers()});
          }, 30 * 1000);
        }
      });
    });
  };

  //// Public / Init

  this.init = function(socket){
    var rawdata = fs.readFileSync('public/map/map.json');
    var map = JSON.parse(rawdata);

    ///// Set models
    database.addModel('player');
    database.addModel('item');
    database.addModel('grave');

    map.layers.forEach(function(layer){
      if (layer.name == 'objects') {
        layer.objects.forEach(function(obj){
          if (obj.type == 'item'){
            itemPositions.push(obj);
          }
        });
      }
    });
    var itemsMax = 8;
    var itemCreation = function(){
      if (database.findAll('item').length < itemsMax){
        var itempos = getItemPos();
        var item = {
          uid: util.uuid(),
          //width: 10,
          //height: 30,
          x: itempos.x,
          y: itempos.y,
          type: rndItemType(),
          effect: rndItemEffect(),
          points: rndItemPoint()
        };
        database.create('item', item);
        socket.emit('new-item', item);
      }
    };
    //start with <itemsMax> items
    for (var i=0; i<itemsMax-1; i++) {
      itemCreation();
    }
    setInterval(itemCreation, 60 * 1000); //new item each minute

    initSocket(socket);

    /// movement broadcast
    // setInterval(function(){
    //   data = []
    //   for (var i = 0; i < this.players.length; i++) {
    //     if(this.players[i].moving){
    //       data.push(this.players[i]);
    //     }
    //   }
    //   if (data.length > 0){
    //     socket.emit('update', data);
    //   }
    // }, 50);
  };

};
