var idlechase = new function(){
  //private
  var game = null;
  var socket;
  var config;
  var player;
  var playerData;
  var others = [];
  var items = [];
  var spritesGroup;
  var textGroup;
  var frameRate = 12;
  var cursors;
  var events = {};
  var scene = {

    // init: function(){
    //   // code to stop game from runnning on background
    //   var game = this.sys.game;
    //   game.off('hidden', game.onHidden, game);
    //   game.off('visible', game.onVisible, game);
    // },

    preload: function() {
      this.load.tilemapTiledJSON('map', '/map/map.json');
      this.load.spritesheet('tileset', '/map/tileset.png', {frameWidth: 32, frameHeight: 32});
      this.load.spritesheet('trees', '/map/trees.png', {frameWidth: 32, frameHeight: 32});
      this.load.spritesheet('player', '/sprites/sprites.png', {frameWidth: 48, frameHeight: 48});
      this.load.spritesheet('food', '/sprites/food.png', {frameWidth: 32, frameHeight: 32});
      //this.load.spritesheet('gamepad', '/sprites/gamepad_spritesheet.png', 100, 100);
    },

    create: function() {
      game = this;
      var map = this.make.tilemap({ key: 'map' });
      var tiles = map.addTilesetImage('boulders', 'tileset');
      var trees = map.addTilesetImage('trees', 'trees');

      this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
      this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

      /// Create animations
      createAnimations(this);

      /// Create layers
      map.createStaticLayer('base', tiles);
      map.createStaticLayer('background', trees);
      collisionLayer = map.createDynamicLayer('collision', trees);
      collisionLayer.visible = false;
      collisionLayer.setCollisionByExclusion([-1]);

      spritesGroup = this.physics.add.group();
      /// Add player and others
      addPlayer();
      for (var i = 0; i < others.length; i++) {
        others[i].element = addOther(others[i]);
      }

      this.physics.add.collider(player, collisionLayer);
      this.physics.add.collider(player, spritesGroup);

      map.createStaticLayer('foreground', trees);

      textGroup = this.physics.add.group();

      if ($(window).width() < 768){
        //var gamepad = game.plugins.add(Phaser.Plugin.VirtualGamepad);
        //Game.joystick = gamepad.addJoystick($(window).width()/2, $(window).height() - 100, 0.75, 'gamepad');
        //Game.button = gamepad.addButton(0, 0, 0, 'gamepad')
      }

      // this.input.onDown.add(function(){
      //   $('#textbox').blur();
      //   $('#userlist').removeClass('open');
      // });
      //game.debug.body(player);
      this.events.on('resize', scene.resize, this);
      cursors = this.input.keyboard.addKeys({
        up: 'UP',
        down: 'DOWN',
        left: 'LEFT',
        right: 'RIGHT'
        //space: KeyCodes.SPACE,
        //shift: KeyCodes.SHIFT
      });
    },

    // render: function(){
    //   this.debug.spriteInfo(player, 32, 32);
    // },

    update: function(x, delta){
      if(!player) return;

      var dir = '';
      if (cursors.left.isDown) {
        player.setVelocity(-300, 0);
        player.play('left-'+playerData.color, true);
        dir = 'left';
      } else if (cursors.right.isDown) {
        player.setVelocity(300, 0);
        player.play('right-'+playerData.color, true);
        dir = 'right';
      }else if (cursors.up.isDown) {
        player.setVelocity(0, -300);
        player.play('up-'+playerData.color, true);
        dir = 'up';
      } else if (cursors.down.isDown) {
        player.setVelocity(0, 300);
        player.play('down-'+playerData.color, true);
        dir = 'down';
      } else {
        player.setVelocity(0, 0);
        player.anims.stop();
        dir = '';
      }

    //if (Game.joystick.properties.inUse) {
      // if((Game.joystick && Game.joystick.properties.up) || Game.cursors.up.isDown){
      //   player.body.velocity.y = -300;
      //   player.animations.play('up');
      //   dir = 'up';
      // } else if ((Game.joystick && Game.joystick.properties.down) || Game.cursors.down.isDown) {
      //   player.body.velocity.y = 300;
      //   player.animations.play('down');
      //   dir = 'down';
      // } else if ((Game.joystick && Game.joystick.properties.left) || Game.cursors.left.isDown) {
      //   player.body.velocity.x = -300;
      //   player.animations.play('left');
      //   dir = 'left';
      // } else if ((Game.joystick && Game.joystick.properties.right) || Game.cursors.right.isDown) {
      //   player.body.velocity.x = 300;
      //   player.animations.play('right');
      //   dir = 'right';
      // } else {
      //   player.animations.stop();
      //   dir = '';
      // }
    //}

      //// Emit signal of moving or stop
      if (dir.length > 0){
        socket.emit('user-move', {uid: playerData.uid, dir: dir, x: player.x, y: player.y});
        playerData.moving = true;
      }else{
        if (playerData.moving) {
          socket.emit('user-move', {uid: playerData.uid, x: player.x, y: player.y});
        }
        playerData.moving = false;
      }
      //// Move message
      if (playerData.message && playerData.messageEl) {
        if (playerData.message != playerData.messageEl.text) {
          playerData.messageEl.setText(playerData.message);
        }
        playerData.messageEl.setPosition(player.body.x, player.body.y - 52);
      }
      for (var o = 0; o < others.length; o++) {
        var other = others[o];
        if(other.element && other.element.messageEl && other.message) {
          if (other.message != other.element.messageEl.text) {
            other.element.messageEl.setText(other.message);
          }
          other.element.messageEl.setPosition(other.element.body.x, other.element.body.y - 52);
        }
      }
    },

    resize: function(w, h) {
      if (w === undefined) { w = this.sys.game.config.width; }
      if (h === undefined) { h = this.sys.game.config.height; }
      this.cameras.resize(w, h);
    }
  };

  //

  var spritemap = {
    yellow: {down: {start: 0,  end: 2},  left: {start: 12, end: 14}, right: {start: 24, end: 26}, up: {start: 36, end: 38}},
    orange: {down: {start: 3,  end: 5},  left: {start: 15, end: 17}, right: {start: 27, end: 29}, up: {start: 39, end: 41}},
    gray:   {down: {start: 6,  end: 8},  left: {start: 18, end: 20}, right: {start: 30, end: 32}, up: {start: 42, end: 44}},
    brown:  {down: {start: 9,  end: 11}, left: {start: 21, end: 23}, right: {start: 33, end: 35}, up: {start: 45, end: 47}},
    green:  {down: {start: 48, end: 50}, left: {start: 60, end: 62}, right: {start: 72, end: 74}, up: {start: 84, end: 86}},
    ice:    {down: {start: 52, end: 53}, left: {start: 63, end: 65}, right: {start: 75, end: 77}, up: {start: 87, end: 89}},
    purple: {down: {start: 55, end: 56}, left: {start: 66, end: 68}, right: {start: 78, end: 80}, up: {start: 90, end: 92}},
    blue:   {down: {start: 58, end: 59}, left: {start: 69, end: 71}, right: {start: 81, end: 83}, up: {start: 93, end: 95}}
  };

  var textStyle = {
    font: "18px Arial",
    fill: "#fff",
    align: "left"
  };

  var createAnimations = function(g){
    $.each(Object.keys(spritemap), function(){
      var color = this.toString();
      $.each(Object.keys(spritemap[color]), function(){
        var dir = this.toString();
        g.anims.create({
          key: dir+"-"+color,
          frames: g.anims.generateFrameNumbers('player', spritemap[color][dir]),
          repeat: -1,
          frameRate: frameRate
        });
      });
    });
  }

  var addPlayer = function() {
    player = spritesGroup.create(playerData.x, playerData.y, 'player', spritemap[playerData.color].down.start+1);
    //player = game.physics.add.sprite(playerData.x, playerData.y, 'player', spritemap[playerData.color].down.start);
    playerData.messageEl = game.add.text(player.body.x, player.body.y - 50, '', textStyle, textGroup);

    player.body.collideWorldBounds = true;
    //player.body.immovable = true;
    player.body.setSize(17, 18, false);
    player.body.setOffset(15, 30);

    game.cameras.main.startFollow(player);
  };

  var addOther = function(otherData){
    var other = spritesGroup.create(otherData.x, otherData.y, 'player', spritemap[otherData.color].down.start+1);
    other.messageEl = game.add.text(other.body.x, other.body.y - 50, '', textStyle, textGroup);

    //other.body.collideWorldBounds = true;
    other.body.immovable = true;
    other.body.setSize(17, 18, false);
    other.body.setOffset(15, 30);

    return other;
  };

  var removeOther = function(uid){
    for(var i = 0; i<others.length; i++){
      if (uid == others[i].uid){
        //console.log(others[i]);
        var other = others[i].element;
        if (other){
          other.destroy();
          other.messageEl.destroy();
        }
        break;
      }
    }
  };

  var moveOther = function(otherData){
    for(var i = 0; i<others.length; i++){
      if (otherData.uid == others[i].uid){
        var other = others[i].element;
        if (other){
          //// if dir is present - moves other
          if (otherData.dir && otherData.dir.length > 0) {
            other.x = otherData.x;// - other.body.offset.x;
            other.y = otherData.y;// - other.body.offset.y;
            if (otherData.dir == 'left') {
              //other.setVelocity(-300, 0);
            } else if (otherData.dir == 'right') {
              //other.setVelocity(300, 0);
            }else if (otherData.dir == 'up') {
              //other.setVelocity(0, -300);
            } else if (otherData.dir == 'down') {
              //other.setVelocity(0, 300);
            }
            other.anims.play(otherData.dir+'-'+others[i].color, true);
          //// if there's no dir = stop other
          } else {
            other.setVelocity(0,0);
            other.x = otherData.x;
            other.y = otherData.y;
            other.anims.stop();
          }
        }
        break;
      }
    }
  };

  //// ITEM functions - TODO
  var renderItem = function(item){
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
  };

  var removeItem = function(item){
    // var i = document.getElementById(item.uid);
    // i.parentNode.removeChild(i);
    // for(var j = 0; j<items.length; j++){
    //   if (items[j].uid == item.uid){
    //     items.splice(j, 1);
    //     break;
    //   }
    // }
  };

  var playerGotItem = function(player, item){
    // removeItem(item);
    // socket.emit('got-item', {player: player, item_uid: item.uid});
  }

  var animateCamera = function(g) {
    // //set moving camera
    // var points = [
    //   {x: map.widthInPixels, y: 0},
    //   {x: map.widthInPixels, y: map.heightInPixels},
    //   {x: 0, y: map.heightInPixels},
    //   {x: 0, y: 0}
    // ]
    // var pointsIdx = -1;
    // var duration = 20 * 1000;
    // var panCam = function(){
    //   if (pointsIdx == (points.length-1)) {
    //     pointsIdx = 0;
    //   } else {
    //     pointsIdx += 1;
    //   }
    //   g.cameras.main.pan(points[pointsIdx].x, points[pointsIdx].y, duration, 'Linear', true);
    // };
    // cameraAnimation = setInterval(panCam, duration);
    // panCam();

    /// code to stop the camera animation
    ///clearInterval(cameraAnimation);
  };

  var trigger = function(event, data){
    if (events[event]) {
      events[event].apply(game, data);
    }
  }

  var initEventHandler = function() {
    /// Create socket
    socket = io.connect();

    /// own player entered
    socket.on('user-enter', function( data ) {
      //console.log('--ENTER--');
      // store player and others data
      playerData = data.player;
      for (var i = 0; i < data.players.length; i++) {
        others.push(data.players[i]);
      }
      trigger('players-change', [others]);
      for (var i = 0; i < data.items.length; i++) {
        //renderItem(data.items[i]);
      }
      trigger('preload');
      /// start game
      var phaser =  new Phaser.Game({
        type: Phaser.AUTO,
        parent: 'game',
        width: config.width,
        height: config.height,
        autoResize: true,
        physics: {
          default: 'arcade'
        },
        scene: scene
      });
      trigger('load');

      /// Add window resize listener
      window.addEventListener('resize', function (event) {
        phaser.resize(window.innerWidth, innerHeight);
      }, false);
    });

    // user joins
    socket.on('user-join', function( data ) {
      if(playerData && data.uid != playerData.uid){
        var el = addOther(data.player);
        data.player.element = el;
        others.push(data.player);
      }
      trigger('players-change', [data.players]);
    });
    /// user exits
    socket.on('user-exit', function( data ) {
      //console.log('--EXIT--');
      trigger('players-change', data.players);
      for (var i = 0; i < others.length; i++) {
        if(data.uid == others[i].uid){
          removeOther(others[i].uid);
          others.splice(i, 1);
          break;
        }
      }
    });

    socket.on('other-move', function(data){
      //console.log('--MOVE--');
      for (var i = 0; i < others.length; i++) {
        if(others[i].uid == data.uid){
          moveOther(data);
        }
      }
    });

    socket.on('new-item', function(item){
      //renderItem(item);
    });

    socket.on('item-gone', function(data){
      //removeItem({uid: data.item_uid});
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
        }, 45 * 1000);
      }
    });

    socket.on('update', function(data){
      //console.log('--UPDATE--');
      if (data.players) {
        trigger('players-change', data.players);
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
        trigger('message', [data.name, data.message]);

      }
      // else if (Array.isArray(data)){
      //   for (var i = 0; i < data.length; i++) {
      //     if(data[i].uid != playerData.uid){
      //       moveOther(data[i]);
      //     }
      //   }
      // }
    });
  };

  //public
  this.initGame = function(name, color, initialconfig) {
    if (game) return false;

    config = initialconfig;

    ////Add socket event handlers
    initEventHandler();

    socket.emit('user-connect', {name: name, color: color});

    return true;
  };

  this.issueCommand = function(text) {
    var parts = text.split(' ');
    /// /name command
    if (parts[0] == '/name' && parts[1]){
      socket.emit('user-cmd', {uid: playerData.uid, cmd: 'name', value: parts[1].substring(0,20) });
    /// send message
    }else if (text.trim().length > 0){
      playerData.message = text.substring(0,55);
      socket.emit('user-message', {name: playerData.name, uid: playerData.uid, message: playerData.message });
    }
  };

  /// add event listener
  this.on = function(event, callback) {
    events[event] = callback;
  };
};
