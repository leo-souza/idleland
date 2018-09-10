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

game.newPlayer = function(uid, attrs){
  return {
    uid: uid,
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
  }, 90);
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
