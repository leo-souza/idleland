const util = require('./util.js');
const fs = require('fs');

module.exports = new function(){
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
  var itemPoints = [100, 250, 500];
  var itemEffects = ['speed', 'big', 'small'];
  var socket;

  var getSpawnPos = function(){
    return spawns[Math.floor(Math.random()*spawns.length)];
  };
  var getItemPos = function(){
    return itemPositions[Math.floor(Math.random()*itemPositions.length)];
  }
  var getItemType = function(){
    var types = ['carrot', 'meat', 'fish', 'orange', 'grape','apple',
     'bread', 'egg', 'cheese', 'bag', 'brocolli', 'tomato'];
    return types[Math.floor(Math.random()*types.length)]
  };

  ////
  this.players = [];
  this.items = [];

  this.init = function(sock){
    var rawdata = fs.readFileSync('public/map/map.json');
    var map = JSON.parse(rawdata);

    socket = sock;

    map.layers.forEach(function(layer){
      if (layer.name == 'objects') {
        layer.objects.forEach(function(obj){
          if (obj.type == 'item'){
            itemPositions.push(obj);
          }
        });
      }
    });

    var itemCreation = function(){
      if (public.items.length < 2){
        var itempos = getItemPos();
        var item = {
          uid: util.uuid(),
          //width: 10,
          //height: 30,
          x: itempos.x,
          y: itempos.y,
          type: getItemType(),
          effect: itemEffects[Math.floor(Math.random()*itemEffects.length)],
          points: itemPoints[Math.floor(Math.random()*itemPoints.length)]
        };
        public.items.push(item);
        socket.emit('new-item', item);
      }
    };
    itemCreation();
    setInterval(itemCreation, 90 * 1000);

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

  this.newPlayer = function(uid, attrs){
    var spawn = getSpawnPos();
    return {
      uid: uid,
      points: 0,
      x: spawn.x,
      y: spawn.y,
      name: attrs.name,
      color: attrs.color,
      moving: false
    };
  };

  this.findPlayerIdx = function(uid){
    for (var i = 0; i < this.players.length; i++) {
      if(public.players[i].uid == uid){
        return i;
      }
    }
    return -1;
  };

};
