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

game.init = function(socket){

  var itemCreation = function(){

    if (game.items.length == 0){
      var itempos = itemPosition();
      var item = {
        uid: util.uuid(),
        x: itempos.x,
        y: itempos.y,
        effect: 'speed'
      };
      game.items.push(item);
      socket.emit('new-item', item);
    }

  };

  ///
  setInterval(itemCreation, 2 * 60 * 1000);
};

game.players = [];
game.items = [];
game.boxes = [{
  x: 74,
  y: 52,
  width: 82,
  height: 262
},{
  x: 242,
  y: 124,
  width: 72,
  height: 195
},{
  x: 70,
  y: 373,
  width: 400,
  height: 62
},{
  x: 468,
  y: 124,
  width: 319,
  height: 82
},{
  x: 587,
  y: 257,
  width: 369,
  height: 78
},{
  x: 888,
  y: 49,
  width: 58,
  height: 147
},{
  x: 1036,
  y: 124,
  width: 60,
  height: 438
},{
  x: 878,
  y: 429,
  width: 72,
  height: 218
},{
  x: 709,
  y: 429,
  width: 64,
  height: 131
},{
  x: 64,
  y: 548,
  width: 185,
  height: 64
},{
  x: 333,
  y: 544,
  width: 149,
  height: 70
},{
  x: 539,
  y: 449,
  width: 96,
  height: 62
}];
