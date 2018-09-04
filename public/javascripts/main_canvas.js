window.requestAnimFrame = (function(){
    return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame   ||
    window.mozRequestAnimationFrame      ||
    window.oRequestAnimationFrame        ||
    window.msRequestAnimationFrame       ||
    function(callback, element){
        window.setTimeout(function(){
            callback(Date.now());
        }, 1000 / 60);
    };
})();

var Player = function(color, startX, startY){
  var inst = this;
  this.x = startX;
  this.y = startY;
  this.width = 10;
  this.height = 10;
  this.speed = 60*6;
  this.color = color;
  this.moving = false;
  this.message = null;
}

//(function(window, document, undefined){
window.addEventListener("load", function () {

  var canvas = document.getElementById("canvas"),
      ctx = canvas.getContext("2d"),
      width = 700,
      height = 400,
      player = null,
      keys = {},
      lastFrameTime = Date.now();

  var boxes = [],
      others = [];

  // dimensions
  boxes.push({
    x: 0,
    y: 0,
    width: 2,
    height: height
  });
  boxes.push({
    x: 0,
    y: height - 2,
    width: width,
    height: 2
  });
  boxes.push({
    x: width - 2,
    y: 0,
    width: 2,
    height: height
  });
  boxes.push({
    x: 0,
    y: 0,
    width: width,
    height: 2
  });

  boxes.push({
    x: 40,
    y: 12,
    width: 80,
    height: 180
  });
  boxes.push({
    x: 170,
    y: 50,
    width: 80,
    height: 180
  });
  boxes.push({
    x: 320,
    y: 100,
    width: 80,
    height: 180
  });
  boxes.push({
    x: 40,
    y: 300,
    width: 380,
    height: 40
  });

  canvas.width = width;
  canvas.height = height;

  function renderArena(){

    ctx.clearRect(0, 0, width, height);

    //Boxes
    ctx.fillStyle = "black";
    for (var i = 0; i < boxes.length; i++) {
      ctx.fillRect(boxes[i].x, boxes[i].y, boxes[i].width, boxes[i].height);
    }
  }

  function renderPlayer(playr){
    ctx.fillStyle = playr.color;
    ctx.fillRect(playr.x, playr.y, playr.width, playr.height);

    if(playr.message){
      ctx.fillStyle = playr.color;
      ctx.font = "16px Helvetica";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(playr.message, playr.x, playr.y - 20);
    }
  }

  function movePlayer(mod){
    var x = player.x,
        y = player.y;

    if (38 in keys) { // Player holding up
      y = player.y - (player.speed * mod);
    }
    if (40 in keys) { // Player holding down
      y = player.y + (player.speed * mod);
    }
    if (37 in keys) { // Player holding left
      x = player.x - (player.speed * mod);
    }
    if (39 in keys) { // Player holding right
      x = player.x + (player.speed * mod);
    }

    //Boxes
    for (var i = 0; i < boxes.length; i++) {
      var dir = colCheck(player, boxes[i]);
      if (dir === "l" || dir === "r") {
          x = player.x;
      } else if (dir === "b" || dir === "t") {
          y = player.y;
      }
    }
    //Others
    for (var i = 0; i < others.length; i++) {
      var dir = colCheck(player, others[i]);
      if (dir === "l" || dir === "r") {
        x = player.x;
      } else if (dir === "b" || dir === "t") {
        y = player.y;
      }
    }

    if(y != player.y || x != player.x){
      player.y = y;
      player.x = x;
      player.message = null;
      socket.emit('moving', {player: player});
    }
    return [x,y];
  }

  function update() {
    var now = Date.now();
    var delta = now - lastFrameTime;

    renderArena();

    movePlayer(delta/1000);

    renderPlayer(player);
    for (var i = 0; i < others.length; i++) {
      renderPlayer(others[i]);
    }

    lastFrameTime = now;
    requestAnimFrame(update);
  }

  function colCheck(shapeA, shapeB) {
    // get the vectors to check against
    var vX = (shapeA.x + (shapeA.width / 2)) - (shapeB.x + (shapeB.width / 2)),
      vY = (shapeA.y + (shapeA.height / 2)) - (shapeB.y + (shapeB.height / 2)),
      // add the half widths and half heights of the objects
      hWidths = (shapeA.width / 2) + (shapeB.width / 2),
      hHeights = (shapeA.height / 2) + (shapeB.height / 2),
      colDir = null;

    // if the x and y vector are less than the half width or half height, they we must be inside the object, causing a collision
    if (Math.abs(vX) < hWidths && Math.abs(vY) < hHeights) {
      // figures out on which side we are colliding (top, bottom, left, or right)
      var oX = hWidths - Math.abs(vX),
          oY = hHeights - Math.abs(vY);
      if (oX >= oY) {
        if (vY > 0) {
          colDir = "t";
          shapeA.y += oY;
        } else {
          colDir = "b";
          shapeA.y -= oY;
        }
      } else {
        if (vX > 0) {
          colDir = "l";
          shapeA.x += oX;
        } else {
          colDir = "r";
          shapeA.x -= oX;
        }
      }
    }
    return colDir;
  }

  document.body.addEventListener("keydown", function (e) {
      keys[e.keyCode] = true;
  });

  document.body.addEventListener("keyup", function (e) {
      delete keys[e.keyCode];
      if(e.keyCode == 32){ //spacebar
        document.getElementById('textbox').focus();
      }
  });

  document.getElementById('textbox').addEventListener("keyup", function (e) {
    if(e.keyCode == 13){
      player.message = this.value;
      socket.emit('message', {uid: player.uid, message: this.value });
      this.value = null;
    }
  });

  if(!player){
    document.getElementById('colors').style.display = 'block';
  }

  $('.color').click(function(){
    document.getElementById('colors').style.display = '';
    socket.emit('connect', {player: new Player($(this).data('color'), 200, 380) });
    renderArena();
  });

  function buildlist(list){
    html = "";
    for (var i = 0; i < list.length; i++) {
      var uid = Object.keys(list[i])[0];
      html = html + "<div><span class=\""+list[i][uid].color+"\">&nbsp;&nbsp;&nbsp;</span>&nbsp;"+uid+"</div>";
    }
    document.getElementById('userlist').innerHTML = html;
  }

  var socket = io.connect();
  socket.on('enter', function( data ) {
    console.log('ENTOU')
    player = data.player;
    for (var i = 0; i < data.players.length; i++) {
      var other_id = Object.keys(data.players[i])[0]
      others.push(data.players[i][other_id]);
    }
    update();
  });
  socket.on('join', function( data ) {
    if(!player || data.uid != player.uid)
      others.push(data.player);
    buildlist(data.players);
  });
  socket.on('exit', function( data ) {
    buildlist(data.players);
    for (var i = 0; i < others.length; i++) {
      if(data.uid == others[i].uid){
        others.splice(i, 1);
        break;
      }
    }
  });

  socket.on('update', function(data){
    if(data.player){
      for (var i = 0; i < others.length; i++) {
        if(data.player.uid == others[i].uid){
          others[i] = data.player;
        }
      }
    }else if(data.uid){
      for (var i = 0; i < others.length; i++) {
        if(data.uid == others[i].uid){
          others[i].message = data.message;
        }
      }
    }
  });

});
//}(this, this.document));
