var game = module.exports;
var util = require('./util.js');

function itemPosition(){
  var positions = [{
    x: 188,
    y: 92
  },{
    x: 279,
    y: 469
  },{
    x: 989,
    y: 481
  },{
    x: 982,
    y: 88
  },{
    x: 1141,
    y: 475
  }]
  return positions[Math.floor(Math.random()*positions.length)];
}

function spawnPosition(){
  var spawns = [
    {x: 410, y: 115},
    {x: 1140, y: 935},
    {x: 1710, y: 3035},
    {x: 140, y: 2920},
    {x: 2645, y: 3015},
    {x: 2916, y: 1480}
  ];
  return spawns[Math.floor(Math.random()*spawns.length)];
}

game.newPlayer = function(uid, attrs){
  var spawn = spawnPosition();
  return {
    uid: uid,
    x: spawn.x,
    y: spawn.y,
    name: attrs.name,
    color: attrs.color,
    moving: false
  };
};

game.init = function(socket){

  var itemCreation = function(){

    if (game.items.length == 0){
      var itempos = itemPosition();
      var item = {
        uid: util.uuid(),
        width: 10,
        height: 30,
        x: itempos.x,
        y: itempos.y,
        effect: 'speed'
      };
      game.items.push(item);
      socket.emit('new-item', item);
    }

  };

  ///
  setInterval(itemCreation, 90 * 1000);
  /// movement broadcast
  setInterval(function(){
    data = []
    for (var i = 0; i < game.players.length; i++) {
      if(game.players[i].moving){
        data.push(game.players[i]);
      }
    }
    if (data.length > 0){
      socket.emit('update', data);
    }
  }, 30);
};

game.findPlayerIdx = function(uid){
  for (var i = 0; i < game.players.length; i++) {
    if(game.players[i].uid == uid){
      return i;
    }
  }
  return -1;
};

game.players = [];
game.items = [];
