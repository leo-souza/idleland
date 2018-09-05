(function () {
  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  window.requestAnimationFrame = requestAnimationFrame;
})();

var Player = function(name, color, startX, startY){
  var inst = this;
  this.name = name;
  this.x = startX;
  this.y = startY;
  this.width = 15;
  this.height = 15;
  this.speed = 6;
  this.velX = 0;
  this.velY = 0;
  this.color = color;
  this.moving = false;
}

window.addEventListener("load", function () {

  var canvas = document.getElementById("canvas"),
      gameWrap = document.getElementById("game"),
      width = gameWrap.offsetWidth,
      height = gameWrap.offsetHeight,
      player = null,
      keys = {},
      friction = 0.8,
      svgns = canvas.getAttribute('xmlns');

  var boxes = [],
      borders = {},
      items = [],
      others = [];

  window.addEventListener("resize", renderArena);

  function renderArena(){
    width = gameWrap.offsetWidth;
    height = gameWrap.offsetHeight;
    canvas.setAttributeNS(null, 'width', width);
    canvas.setAttributeNS(null, 'height', height);

    // Outer borders //
    if (!borders.left){
      borders.left = {
        x: 0,
        y: 0,
        width: 2,
        height: height
      };
    }else{
      borders.left.height = height;
    }
    if (!borders.bottom){
      borders.bottom = {
        x: 0,
        y: height - 2,
        width: width,
        height: 2
      };
    }else{
      borders.bottom.y = height - 2;
      borders.bottom.width = width;
    }
    if (!borders.right){
      borders.right = {
        x: width - 2,
        y: 0,
        width: 2,
        height: height
      };
    } else {
      borders.right.x = width - 2;
      borders.right.height = height;
    }
    if (!borders.top) {
      borders.top = {
        x: 0,
        y: 0,
        width: width,
        height: 2
      };
    } else {
      borders.top.width = width;
    }
    var sides = ['top', 'left', 'bottom', 'right'];
    for (var i = 0; i < sides.length; i++) {
      var side = sides[i];
      var border = null;
      if (borders[side].element) {
        border = borders[side].element;
      }else{
        border = document.createElementNS(svgns, 'rect');
      }
      border.setAttributeNS(null, 'x', borders[side].x);
      border.setAttributeNS(null, 'y', borders[side].y);
      border.setAttributeNS(null, 'width', borders[side].width);
      border.setAttributeNS(null, 'height', borders[side].height);
      border.setAttributeNS(null, 'fill', '#bbb');
      if (!borders[side].element){
        borders[side].element = border;
        canvas.appendChild(border);
      }
    }

    //Boxes
    for (var i = 0; i < boxes.length; i++) {
      var box = null;
      if (boxes[i].element) {
        box = boxes[i].element
      }else{
        box = document.createElementNS(svgns, 'rect');
      }
      box.setAttributeNS(null, 'x', boxes[i].x);
      box.setAttributeNS(null, 'y', boxes[i].y);
      box.setAttributeNS(null, 'width', boxes[i].width);
      box.setAttributeNS(null, 'height', boxes[i].height);
      box.setAttributeNS(null, 'rx', 5);
      box.setAttributeNS(null, 'fill', '#746956');
      if (!boxes[i].element) {
        canvas.appendChild(box);
        boxes[i].element = box;
      }
    }
  }

  function movePlayer(playr, ks){
    if(!ks) return;

    if (ks[39]) { // || ks[68]
      // right arrow
      if (playr.velX < playr.speed) {
        playr.velX++;
      }
    }
    if (ks[37]) { // || ks[65]
      // left arrow
      if (playr.velX > -playr.speed) {
        playr.velX--;
      }
    }

    if (ks[40]) {// || ks[83]
      // up arrow
      if (playr.velY < playr.speed) {
        playr.velY++;
      }
    }
    if (ks[38]) { // || ks[87]
      // down arrow
      if (playr.velY > -playr.speed) {
        playr.velY--;
      }
    }
    //// slow down with friction
    playr.velX = parseFloat((playr.velX * friction).toFixed(8));
    playr.velY = parseFloat((playr.velY * friction).toFixed(8));
  }

  function updatePlayer(playr){

    var p = document.getElementById(playr.uid);

    if(p.getAttribute('cx') != playr.x || p.getAttribute('cy') != playr.y){
      socket.emit('user-moving', {player: player});
    }

    p.setAttributeNS(null, 'cx', playr.x);
    p.setAttributeNS(null, 'cy', playr.y);

    var t = document.getElementById('msg-'+playr.uid);
    t.setAttributeNS(null, 'x', playr.x - playr.width);
    t.setAttributeNS(null, 'y', playr.y - 20);
    t.textContent = playr.message || "";

    //if(playr.uid == player.uid && (playr.x < -1 || playr.y < -1 || playr.x > width+1 || playr.y > height+1)){
      //alert('U LOST!');
      // playr.x = 200;
      // playr.y = 380;
      // playr.velX = 0;
      // playr.velY = 0;
      // keys = {};
    //}
  }

  function renderPlayer(playr){
    //var g = document.createElementNS(svgns, 'g');

    var avatar = document.createElementNS(svgns, 'circle');
    avatar.setAttributeNS(null, 'id', playr.uid);
    avatar.setAttributeNS(null, 'cx', playr.x);
    avatar.setAttributeNS(null, 'cy', playr.y);
    avatar.setAttributeNS(null, 'r', playr.width);
    avatar.setAttributeNS(null, 'fill', playr.color);
    canvas.appendChild(avatar);

    var talk = document.createElementNS(svgns, 'text');
    talk.setAttributeNS(null, 'id', 'msg-'+playr.uid);
    talk.setAttributeNS(null, 'fill', playr.color);
    talk.setAttributeNS(null, 'font', "16px Helvetica");
    talk.setAttributeNS(null, 'textAlign', "left");
    talk.setAttributeNS(null, 'textBaseline', "top");
    talk.setAttributeNS(null, 'x', playr.x - playr.width);
    talk.setAttributeNS(null, 'y', playr.y - 20);
    canvas.appendChild(talk);
  }

  function removePlayer(playr){
    var p = document.getElementById(playr.uid);
    p.parentNode.removeChild(p);
    var t = document.getElementById('msg-'+playr.uid);
    t.parentNode.removeChild(t);
  }

  function update() {
    movePlayer(player, keys);

    //Borders
    var sides = ['top', 'left', 'bottom', 'right'];
    for (var i = 0; i < sides.length; i++) {
      var side = sides[i];
      var dir = colCheck(player, borders[side]);
      if (dir === "l" || dir === "r") {
        player.velX = 0;
      } else if (dir === "b" || dir === "t") {
        player.velY = 0;
      }
    }
    //Boxes
    for (var i = 0; i < boxes.length; i++) {
      var dir = colCheck(player, boxes[i]);
      if (dir === "l" || dir === "r") {
        player.velX = 0;
      } else if (dir === "b" || dir === "t") {
        player.velY = 0;
      }
    }
    //Others
    for (var i = 0; i < others.length; i++) {
      updatePlayer(others[i]);

      var dir = colCheck(player, others[i]);
      if (dir === "l" || dir === "r") {
        player.velX = 0;
      } else if (dir === "b" || dir === "t") {
        player.velY = 0;
      }
    }

    if(player.velY == 0 || player.velX == 0){
      player.moving = false;
    }else{
      player.moving = true;
    }

    ///// items
    for (var i = 0; i < items.length; i++) {
      var colItem = colCheck(player, items[i]);
      if (colItem != null) {
        playerGotItem(player, items[i]);
      }
    }

    //if(player.moving) player.message = null;

    player.x += player.velX;
    player.y += player.velY;

    updatePlayer(player);

    requestAnimationFrame(update);
  }

  function colCheck(shapeA, shapeB) {
    // get the vectors to check against
    var vX = shapeA.x - (shapeB.x + (shapeB.width / 2)),
      vY = shapeA.y - (shapeB.y + (shapeB.height / 2)),
      // add the half widths and half heights of the objects
      hWidths = shapeA.width + (shapeB.width / 2),
      hHeights = shapeA.height + (shapeB.height / 2),
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
      keys[e.keyCode] = false;
      if(e.keyCode == 32){ //spacebar
        document.getElementById('textbox').focus();
      }
  });

  document.getElementById('textbox').addEventListener("keyup", function (e) {
    if(e.keyCode == 13){ //Enter
      var msg = this.value;
      var parts = msg.split(' ');
      if (parts[0] == '/name' && parts[1]){
        socket.emit('user-cmd', {uid: player.uid, cmd: 'name', value: parts[1].substring(0,20) });
      }else{
        player.message = msg.substring(0,55);
        socket.emit('user-message', {uid: player.uid, message: player.message });
      }
      this.value = null;
    }
  });

  if(!player){
    document.getElementById('initial-splash').style.display = 'block';
    document.getElementById('content-wrapper').style.display = 'none';
  }

  //// Enter event handler
  $('#enter-form').submit(function(){
    var $this = $(this);
    var name = $this.find('#name-input').val();
    var color = $this.find('[name=color-input]:checked').val();
    document.getElementById('initial-splash').style.display = 'none';
    document.getElementById('content-wrapper').style.display = '';
    var playr = new Player(name.substring(0,20), color, 200, 380);
    socket.emit('user-connect', {player: playr});
    return false;
  });

  function renderItem(item){
    item.width = 10;
    item.height = 30;

    var itemEl = document.createElementNS(svgns, 'rect');
    itemEl.setAttributeNS(null, 'id', item.uid);
    itemEl.setAttributeNS(null, 'x', item.x);
    itemEl.setAttributeNS(null, 'y', item.y);
    itemEl.setAttributeNS(null, 'width', item.width);
    itemEl.setAttributeNS(null, 'height', item.height);
    itemEl.setAttributeNS(null, 'rx', 5);
    itemEl.setAttributeNS(null, 'fill', 'red');
    canvas.appendChild(itemEl);
    items.push(item);
  }

  function playerGotItem(player, item){
    var i = document.getElementById(item.uid);
    i.parentNode.removeChild(i);
    for(var j = 0; j<items.length; j++){
      if (items[j].uid == item.uid){
        items.splice(j, 1);
        break;
      }
    }
    socket.emit('got-item', {player: player, item_uid: item.uid});
  }

  function buildlist(list){
    html = "";
    for (var i = 0; i < list.length; i++) {
      var uid = Object.keys(list[i])[0];
      var text = uid;
      if (list[i][uid].name){
        text = list[i][uid].name;
      }
      html = html + "<div><span class=\""+list[i][uid].color+"\">&nbsp;&nbsp;&nbsp;</span>&nbsp;"+text+"</div>";
    }
    document.getElementById('userlist').innerHTML = html;
  }

  var socket = io.connect();
  socket.on('user-enter', function( data ) {
    player = data.player;
    for (var i = 0; i < data.players.length; i++) {
      var other_id = Object.keys(data.players[i])[0]
      others.push(data.players[i][other_id]);
      renderPlayer(data.players[i][other_id]);
    }
    for (var i = 0; i < data.boxes.length; i++) {
      boxes.push(data.boxes[i]);
    }
    for (var i = 0; i < data.items.length; i++) {
      renderItem(items[i]);
    }
    renderArena();
    renderPlayer(player);
    update();
  });

  socket.on('new-item', function(item){
    renderItem(item);
  });

  socket.on('user-powerup', function(data){
    if (data.effect == 'speed'){
      var oldSpeed = player.speed;
      var oldFriction = friction;
      player.speed = 12;
      friction = 0.92;
      setTimeout(function(){
        player.speed = oldSpeed;
        friction = oldFriction;
      }, 60 * 1000);
    }

  });

  socket.on('user-join', function( data ) {
    if(player && data.uid != player.uid){
      others.push(data.player);
      renderPlayer(data.player);
    }
    buildlist(data.players);
  });
  socket.on('user-exit', function( data ) {
    buildlist(data.players);
    for (var i = 0; i < others.length; i++) {
      if(data.uid == others[i].uid){
        others.splice(i, 1);
        removePlayer(data.player);
        break;
      }
    }
  });

  socket.on('update', function(data){
    if (data.players) {
      buildlist(data.players);
    }else if(data.player){
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

  ////// DEV / debug
  $(canvas).click(function(e){
    //console.log(e.offsetX+', '+e.offsetY);
    //player.speed = 12;
    //friction = 0.92;
  });


});
