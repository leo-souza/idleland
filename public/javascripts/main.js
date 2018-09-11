$(document).ready(function(){

  /// hide game
  document.getElementById('initial-splash').style.display = 'block';
  document.getElementById('content-wrapper').style.display = 'none';

  function buildlist(list){
    html = "";
    for (var i = 0; i < list.length; i++) {
      html = html + "<div><span class=\""+list[i].color+"\">&nbsp;&nbsp;&nbsp;</span>&nbsp;"+list[i].name+"</div>";
    }
    document.getElementById('userlist').innerHTML = html;
  }

  $('#userlist').click(function(){
    $(this).toggleClass('open');
    return false;
  });

  //// ITEM functions - TODO
  function renderItem(item){
    // var itemEl = document.createElementNS(svgns, 'rect');
    // itemEl.setAttributeNS(null, 'id', item.uid);
    // itemEl.setAttributeNS(null, 'x', item.x);
    // itemEl.setAttributeNS(null, 'y', item.y);
    // itemEl.setAttributeNS(null, 'width', item.width);
    // itemEl.setAttributeNS(null, 'height', item.height);
    // itemEl.setAttributeNS(null, 'rx', 5);
    // itemEl.setAttributeNS(null, 'fill', 'red');
    // canvas.appendChild(itemEl);
    // items.push(item);
  }

  function removeItem(item){
    // var i = document.getElementById(item.uid);
    // i.parentNode.removeChild(i);
    // for(var j = 0; j<items.length; j++){
    //   if (items[j].uid == item.uid){
    //     items.splice(j, 1);
    //     break;
    //   }
    // }
  }

  function playerGotItem(player, item){
    // removeItem(item);
    // socket.emit('got-item', {player: player, item_uid: item.uid});
  }

  //// Enter event handler
  $('#enter-form').submit(function(){
    var $this = $(this);
    var name = $this.find('#name-input').val();
    var color = $this.find('[name=color-input]:checked').val();
    document.getElementById('initial-splash').style.display = 'none';
    document.getElementById('content-wrapper').style.display = 'block';
    //
    socket.emit('user-connect', {name: name, color: color});
    return false;
  });

  //// space -> Focus on textbox
  document.body.addEventListener("keyup", function (e) {
    if(e.keyCode == 32){ //spacebar
      document.getElementById('textbox').focus();
    }
  });
  ///// textbox - enter - send message
  document.getElementById('textbox').addEventListener("keyup", function (e) {
    if(e.keyCode == 13){ //Enter
      var msg = this.value;
      var parts = msg.split(' ');
      if (parts[0] == '/name' && parts[1]){
        socket.emit('user-cmd', {uid: playerData.uid, cmd: 'name', value: parts[1].substring(0,20) });
      }else if (msg.trim().length > 0){
        playerData.message = msg.substring(0,55);
        socket.emit('user-message', {name: playerData.name, uid: playerData.uid, message: playerData.message });
      }
      this.value = null;
    }
  });

  /// Resize game
  $(window).resize(function(){
    var gameWrap = document.getElementById("game");
    if(game){
      game.scale.setGameSize(gameWrap.offsetWidth, gameWrap.offsetHeight);
      game.scale.refresh();
    }
  })

  /////  SOCKET ////

  var socket = io.connect();
  /// own player entered
  socket.on('user-enter', function( data ) {
    playerData = data.player;
    for (var i = 0; i < data.players.length; i++) {
      others.push(data.players[i]);
      //Game.addOther(data.players[i]);
    }
    for (var i = 0; i < data.items.length; i++) {
      //renderItem(data.items[i]);
    }
    Game.initGame();
  });

  socket.on('new-item', function(item){
    //renderItem(item);
  });
  socket.on('item-gone', function(data){
    //removeItem({uid: data.item_uid});
  });

  socket.on('user-powerup', function(data){
    // if (data.effect == 'speed'){
    //   var oldSpeed = player.speed;
    //   var oldFriction = friction;
    //   player.speed = 12;
    //   friction = 0.92;
    //   setTimeout(function(){
    //     player.speed = oldSpeed;
    //     friction = oldFriction;
    //   }, 45 * 1000);
    // }
  });

  socket.on('user-join', function( data ) {
    if(playerData && data.uid != playerData.uid){
      var el = Game.addOther(data.player);
      data.player.element = el;
      others.push(data.player);
    }
    buildlist(data.players);
  });

  socket.on('user-exit', function( data ) {
    buildlist(data.players);
    for (var i = 0; i < others.length; i++) {
      if(data.uid == others[i].uid){
        Game.removeOther(others[i].uid);
        others.splice(i, 1);
        break;
      }
    }
  });

  socket.on('other-stop', function(data){
    for (var i = 0; i < others.length; i++) {
      if(others[i].uid == data.uid){
        Game.stopOther(data.uid);
      }
    }
  })

  var msgBox = new function(){
    var $cont = $('#msgbox .content'),
        $parent = $cont.parent();

    this.consolidateTop = function(){
      $cont.animate({bottom: 0}, 180);
    };
    this.removeExcess = function(){
      var size = $cont.find(' > *').length;
      $cont.find(' > *:lt('+(size > 10 ? size - 10 : 0)+')').remove();
    };
    this.appendMessage= function(name, msg){
      $cont.css({bottom: -22});
      $cont.append(
        '<div><b>'+name+':</b> '+msg+'</div>'
      );
      this.consolidateTop();
      this.removeExcess();
    };
  };

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
      /// Add message to message-box
      msgBox.appendMessage(data.name, data.message);

    }else if (Array.isArray(data)){
      for (var i = 0; i < data.length; i++) {
        if(data[i].uid != playerData.uid){
          Game.moveOther(data[i]);
        }
      }
    }
    //console.log('update');
  });

  //// INIT GAME
  /// VARS
  var player = null;
  var playerData;
  var others = [];
  var game;
  var Game = {};
  var collisionLayer;
  var spritesGroup;

  Game.spritemap = {
    yellow: {
      left: [12, 13, 14],
      right: [24, 25, 26],
      up: [36, 37, 38],
      down: [0, 1, 2]
    },
    brown: {
      left: [21, 22, 23],
      right: [33, 34, 35],
      up: [45, 46, 47],
      down: [9, 10, 11]
    },
    gray: {
      left: [18,19,20],
      right: [30,31,32],
      up: [42,43,44],
      down: [6,7,8]
    },
    orange: {
      left: [15,16,17],
      right: [27,28,29],
      up: [39,40,41],
      down: [3,4,5]
    },
    green: {
      left: [60,61,62],
      right: [72,73,74],
      up: [84,85,86],
      down: [48,49,50]
    }
  }

  Game.addPlayer = function(){
    player = spritesGroup.create(playerData.x, playerData.y, 'player');
    player.frame = Game.spritemap[playerData.color].down[1];

    var frate = 12;
    player.animations.add('left', Game.spritemap[playerData.color].left, frate, true);
    player.animations.add('right', Game.spritemap[playerData.color].right, frate, true);
    player.animations.add('down', Game.spritemap[playerData.color].down, frate, true);
    player.animations.add('up', Game.spritemap[playerData.color].up, frate, true);

    game.physics.arcade.enable(player);
    player.body.collideWorldBounds = true;
    //player.body.immovable = true;
    player.body.setSize(15,12,16,32);

    game.camera.follow(player) ; //, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);
  };

  Game.addOther = function(otherData){
    var other = spritesGroup.create(otherData.x, otherData.y, 'player');
    other.frame = Game.spritemap[otherData.color].down[1];

    var frate = 12;
    other.animations.add('left', Game.spritemap[otherData.color].left, frate, true);
    other.animations.add('right', Game.spritemap[otherData.color].right, frate, true);
    other.animations.add('down', Game.spritemap[otherData.color].down, frate, true);
    other.animations.add('up', Game.spritemap[otherData.color].up, frate, true);

    game.physics.arcade.enable(other);
    //other.body.immovable = true;
    other.body.moves = false;
    other.body.setSize(15,12,16,32);
    //player.body.collideWorldBounds = true;

    other.messageEl = game.add.text(other.body.x, other.body.y - 50, '', {
      font: "18px Arial",
      fill: "#fff",
      align: "left"
    });

    //game.camera.follow(player, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);
    return other;
  };

  Game.removeOther = function(uid){
    for(var i = 0; i<others.length; i++){
      if (uid == others[i].uid){
        var other = others[i].element;
        if (other){
          other.destroy();
        }
        break;
      }
    }
  }

  Game.initGame = function(){

    /// init
    var gameWrap = document.getElementById("game");
    game = new Phaser.Game('100%', '100%', Phaser.AUTO, gameWrap);
    game.state.add('Game',Game);
    game.state.start('Game');

  };

  Game.init = function(){
    game.stage.disableVisibilityChange = true;
  };

  Game.preload = function() {
    game.load.tilemap('map', '/map/map.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.spritesheet('tileset', '/map/tileset.png', 32, 32);
    game.load.spritesheet('trees', '/map/trees.png', 32, 32);
    game.load.spritesheet('player', '/sprites/sprites.png', 48, 48);
    game.load.spritesheet('gamepad', '/sprites/gamepad_spritesheet.png', 100, 100);
    game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
  };

  Game.create = function(){
    var map = game.add.tilemap('map');

    game.world.setBounds(0, 0, 100*32, 100*32);

    map.addTilesetImage('boulders', 'tileset');
    map.addTilesetImage('trees', 'trees');

    /// Create layers
    map.createLayer('base');
    map.createLayer('background');
    collisionLayer = map.createLayer('collision');
    collisionLayer.visible = false;

    map.setCollisionByExclusion([], true, collisionLayer);

    spritesGroup = game.add.group();

    Game.addPlayer();

    for (var i = 0; i < others.length; i++) {
      others[i].element = Game.addOther(others[i]);
    }

    map.createLayer('foreground');

    playerData.messageEl = game.add.text(player.body.x, player.body.y - 50, '', {
      font: "18px Arial",
      fill: "#fff",
      align: "left"
    });

    if ($(window).width() < 768){
      var gamepad = game.plugins.add(Phaser.Plugin.VirtualGamepad);
      Game.joystick = gamepad.addJoystick($(window).width()/2, $(window).height() - 110, 1, 'gamepad');
      Game.button = gamepad.addButton(0, 0, 0, 'gamepad')
    }

    game.input.onDown.add(function(){
      $('#game canvas').focus();
      $('#userlist').removeClass('open');
    }, this);
    //game.debug.body(player);
    Game.cursors = game.input.keyboard.createCursorKeys();
  };

  Game.stopOther = function(uid){
    for(var i = 0; i<others.length; i++){
      if (uid == others[i].uid){
        var other = others[i].element;
        if (other){
          other.animations.stop();
        }
        break;
      }
    }

  }

  Game.moveOther = function(otherData){

    for(var i = 0; i<others.length; i++){
      if (otherData.uid == others[i].uid){
        var other = others[i].element;
        if (other){

          //var distance = Phaser.Math.distance(other.x, other.y, otherData.x, otherData.y);
          //var tween = game.add.tween(other);
          //tween.to({x:otherData.x,y:otherData.y}, 250);
          //tween.start();
          other.x = otherData.x - other.body.offset.x;
          other.y = otherData.y - other.body.offset.y;
          other.animations.play(otherData.dir);
        }
        break;
      }
    }

  };

  // Game.render = function(){
  //  game.debug.spriteInfo(player, 32, 32);
  // };

  Game.update = function(){
    if(!player) return;

    player.body.velocity.x = 0;
    player.body.velocity.y = 0;

    game.physics.arcade.collide(player, collisionLayer);
    game.physics.arcade.collide(player, spritesGroup);

    var dir = '';
    // if (Game.cursors.up.isDown) {
    //   player.body.velocity.y = -300;
    //   player.animations.play('up');
    //   dir = 'up';
    // } else if (Game.cursors.down.isDown) {
    //   player.body.velocity.y = 300;
    //   player.animations.play('down');
    //   dir = 'down';
    // } else if (Game.cursors.left.isDown) {
    //   player.body.velocity.x = -300;
    //   player.animations.play('left');
    //   dir = 'left';
    // } else if (Game.cursors.right.isDown) {
    //   player.body.velocity.x = 300;
    //   player.animations.play('right');
    //   dir = 'right';
    // } else {
    //   player.animations.stop();
    //   dir = '';
    // }

    //if (Game.joystick.properties.inUse) {
      if((Game.joystick && Game.joystick.properties.up) || Game.cursors.up.isDown){
        player.body.velocity.y = -300;
        player.animations.play('up');
        dir = 'up';
      } else if ((Game.joystick && Game.joystick.properties.down) || Game.cursors.down.isDown) {
        player.body.velocity.y = 300;
        player.animations.play('down');
        dir = 'down';
      } else if ((Game.joystick && Game.joystick.properties.left) || Game.cursors.left.isDown) {
        player.body.velocity.x = -300;
        player.animations.play('left');
        dir = 'left';
      } else if ((Game.joystick && Game.joystick.properties.right) || Game.cursors.right.isDown) {
        player.body.velocity.x = 300;
        player.animations.play('right');
        dir = 'right';
      } else {
        player.animations.stop();
        dir = '';
      }
    //}

    if (dir.length > 0){
      socket.emit('user-moving', {uid: playerData.uid, dir: dir, x: player.body.x, y: player.body.y});
      playerData.moving = true;
    }else{
      if (playerData.moving) socket.emit('user-stop', {uid: playerData.uid});
      playerData.moving = false;
    }

    if (playerData.message && playerData.messageEl) {
      playerData.messageEl.setText(playerData.message);
      playerData.messageEl.position.x = player.body.x;
      playerData.messageEl.position.y = player.body.y - 50;
    }
    for (var o = 0; o < others.length; o++) {
      var other = others[o];
      if(other.element && other.element.messageEl && other.message) {
        other.element.messageEl.setText(other.message);
        other.element.messageEl.position.x = other.element.body.x;
        other.element.messageEl.position.y = other.element.body.y - 50;
      }
    }
  };

});
