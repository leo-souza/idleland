//https://github.com/jackyrusly/jrgame - good example
//https://gamedevacademy.org/how-to-create-a-turn-based-rpg-game-in-phaser-3-part-1/

var idlechase = new function(){
  //private
  var game = null;
  var map
  var socket;
  var config;
  var player;
  var playerData;
  var others = [];
  var items = [];
  var spritesGroup;
  var itemsGroup;
  var textGroup;
  var hitGroup;
  var frameRate = 12;
  var itemFRate = 7;
  var cursors;
  var events = {};
  var world = {

    // init: function(){
    //   // code to stop game from runnning on background
    //   var game = this.sys.game;
    //   game.off('hidden', game.onHidden, game);
    //   game.off('visible', game.onVisible, game);
    // },

    preload: function() {
      this.load.tilemapTiledJSON('map', '/map/map.json');
      //this.load.tilemapTiledJSON('cave', '/map/cave.json');
      this.load.spritesheet('tileset',  '/map/tileset.png',     {frameWidth: 32, frameHeight: 32});
      this.load.spritesheet('trees',    '/map/trees.png',       {frameWidth: 32, frameHeight: 32});
      this.load.spritesheet('player',   '/sprites/sprites.png', {frameWidth: 48, frameHeight: 48});
      this.load.spritesheet('food',     '/sprites/food.png',    {frameWidth: 32, frameHeight: 32});
      this.load.image('gamepad',        '/images/gamepad.png');
      this.load.image('button',         '/images/button.png');
    },

    create: function() {
      game = this;
      map = this.make.tilemap({ key: 'map' });
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
        addOther(others[i]);
      }
      itemsGroup = this.physics.add.group();
      for (var i = 0; i < items.length; i++) {
        addItem(items[i]);
      }
      hitGroup = this.physics.add.group();

      this.physics.add.collider(player, collisionLayer);
      this.physics.add.collider(player, spritesGroup);
      this.physics.add.overlap (player, itemsGroup, function(plyr, item){
        playerGotItem(plyr, item);
      });
      this.physics.add.overlap (hitGroup, hitGroup, function(obj1, obj2){
        if (obj1.player_uid == player.uid || obj2.player_uid == player.uid) {
          playerData.throwing = false;
        }
        obj1.destroy();
        obj2.destroy();
      });
      this.physics.add.overlap (hitGroup, collisionLayer, function(obj, colllision){
        if (colllision.collides) {
          // throw hitting walls/trees
          obj.destroy();
          if (obj.player_uid == player.uid) playerData.throwing = false;
        }
      });
      this.physics.add.overlap (spritesGroup, hitGroup, function(plyr, obj){
        playerHit(plyr, obj);
      });

      /// add objects
      //var objects = map.createFromObjects('objects', 'cave', {}); //map.getObjectLayer('objects')['objects'];
      //objects.forEach(function(item) {
      //  item.displayOriginY = 0; // fix different origin from Tiled
      //});
      //var objectsLayer = this.physics.add.staticGroup();
      //objectsLayer.addMultiple(objects);

      //this.physics.add.overlap(player, objectsLayer, function(){
      //  //console.log(game.scene);
      //  //var caveSc = new Phaser.Scene()
      //});

      /// create foreground layer
      map.createStaticLayer('foreground', trees);

      textGroup = this.physics.add.group();

      if ($(window).width() < 768){
        addGamepad();
      }

      /// blur from textinput on clik
      this.input.on('pointerdown', function(){
        trigger('canvas-click');
      });

      this.events.on('resize', handleResize, this);
      cursors = this.input.keyboard.addKeys({
        up: 'UP',
        down: 'DOWN',
        left: 'LEFT',
        right: 'RIGHT'
      });
    },

    // render: function(){
    //   this.debug.spriteInfo(player, 32, 32);
    // },

    update: function(x, delta){
      if(player && player.active) {
        var dir = '';
        if (userInputs.left()) {
          player.setVelocity(-1*playerData.speed, 0);
          player.play('left-'+playerData.color, true);
          dir = 'left';
        } else if (userInputs.right()) {
          player.setVelocity(playerData.speed, 0);
          player.play('right-'+playerData.color, true);
          dir = 'right';
        }else if (userInputs.up()) {
          player.setVelocity(0, -1*playerData.speed);
          player.play('up-'+playerData.color, true);
          dir = 'up';
        } else if (userInputs.down()) {
          player.setVelocity(0, playerData.speed);
          player.play('down-'+playerData.color, true);
          dir = 'down';
        } else {
          player.setVelocity(0, 0);
          player.anims.stop();
          dir = '';
        }
        //// Emit signal of moving or stop
        if (dir.length > 0){
          socket.emit('user-move', {uid: playerData.uid, dir: dir, x: player.x, y: player.y});
          playerData.moving = true;
          playerData.dir = dir;
        }else{
          if (playerData.moving) {
            socket.emit('user-move', {uid: playerData.uid, x: player.x, y: player.y});
          }
          playerData.moving = false;
        }
        //// Move message
        if (player.messageEl) {
          player.messageEl.setPosition(player.x, player.body.y - 52);
        }
        ///// move hp bar
        hpBar('update', player, playerData);
      }
      /// move message others
      for (var o = 0; o < others.length; o++) {
        var other = others[o].element;
        if(other && other.messageEl) {
          other.messageEl.setPosition(other.x, other.body.y - 52);
        }
      }
      //// move hp bar others
      for (var o = 0; o < others.length; o++) {
        var other = others[o];
        hpBar('update', other.element, other.data);
      }
    }
  };

  //
  var handleResize = function(w, h) {
    if (w === undefined) { w = game.sys.game.config.width; }
    if (h === undefined) { h = game.sys.game.config.height; }
    game.cameras.resize(w, h);
  }

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

  var foodSpritemap = {
    carrot:   {start: 0,  end: 2},
    meat:     {start: 9,  end: 11},
    fish:     {start: 12, end: 14},
    orange:   {start: 21, end: 23},
    grape:    {start: 24, end: 26},
    apple:    {start: 27, end: 29},
    bread:    {start: 30, end: 32},
    egg:      {start: 33, end: 35},
    cheese:   {start: 39, end: 41},
    bag:      {start: 57, end: 59},
    brocolli: {start: 72, end: 74},
    tomato:   {start: 87, end: 89}
  };

  var textStyle = {
    font: "18px Arial",
    color: "#222",
    backgroundColor: '#fff',
    align: "center",
    padding: {x: 5, y: 3}
  };

  var userInputs = {
    up: function(){
      return cursors.up.isDown || (game.gamepad && game.gamepad.dir == 'up');
    },
    right: function(){
      return cursors.right.isDown || (game.gamepad && game.gamepad.dir == 'right');
    },
    down: function(){
      return cursors.down.isDown || (game.gamepad && game.gamepad.dir == 'down');
    },
    left: function(){
      return cursors.left.isDown || (game.gamepad && game.gamepad.dir == 'left');
    }
  }

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
    // food
    $.each(Object.keys(foodSpritemap), function(){
      var food = this.toString();
      var c = g.anims.create({
        key: food,
        frames: g.anims.generateFrameNumbers('food', foodSpritemap[food]),
        repeat: -1,
        frameRate: itemFRate
      });
    });
  }

  var addGamepad = function(){
    var scale = 0.4;
    var alpha = 0.5;
    //TODO get width from game instead of window
    var middle = $(window).width()/2;
    var screenH = $(window).height();
    var screenW = $(window).width();
    var texture = game.textures.get('gamepad');
    var h = texture.source[0].height; //image height
    var x = 30 + (texture.source[0].width/2 * scale);
    var y = screenH - 50 - (0.5*(h*scale));

    game.input.addPointer(2);
    game.gamepad = game.add.image(x, y, 'gamepad')
      .setScale(scale)
      .setScrollFactor(0)
      .setInteractive();
    game.gamepad.alpha = alpha;

    var calcDir = function(x, y){
      var rad = Phaser.Math.Angle.Between(game.gamepad.displayOriginX, game.gamepad.displayOriginY, x, y);
      var angle = Phaser.Math.RadToDeg(rad); //180 ~ -180
      angle = (angle + 360) % 360; // convert to 0~360
      var dir = ((angle > 45) && (angle <= 135)) ? 'down' :
                ((angle > 135) && (angle <= 225)) ? 'left' :
                ((angle > 225) && (angle <= 315)) ? 'up' :
                'right';
      game.gamepad.dir = dir;
    }

    game.gamepad.on('pointerdown', function(ev, x, y){
      this.isDown = true;
      calcDir(x,y);
    });
    game.gamepad.on('pointermove', function(ev, x, y){
      calcDir(x,y);
    });
    game.gamepad.on('pointerup', function(){
      this.isDown = false;
      this.dir = '';
    });
    ////shooter
    game.thrower = game.add.image(screenW-x, y, 'button') //, 'width: 80px; height: 80px; border-radius: 50%; background-color: white; border: 4px solid black;') // opacity: .5;
      .setScrollFactor(0)
      .setInteractive();
    game.thrower.alpha = alpha;
    game.thrower.on('pointerdown', function(){
      throwHit();
    });
  }

  var addPlayer = function() {
    player = spritesGroup.create(playerData.x, playerData.y, 'player', spritemap[playerData.color].down.start+1);
    player.uid = playerData.uid;
    //player = game.physics.add.sprite(playerData.x, playerData.y, 'player', spritemap[playerData.color].down.start);
    player.body.collideWorldBounds = true;
    //player.body.immovable = true;
    player.body.setSize(17, 18, false);
    player.body.setOffset(15, 30);

    player.messageEl = game.add.text(player.x, player.body.y - 52, '', textStyle, textGroup);
    player.messageEl.setOrigin(0.5)
    player.messageEl.setVisible(false);

    hpBar('add', player, playerData);

    //add shoot
    game.input.keyboard.on('keydown_SPACE', function (ev) {
      if (document.activeElement.tagName.toLowerCase() != 'input') {
        throwHit();
      }
    });

    game.cameras.main.startFollow(player);
  };

  var addOther = function(otherData){
    var other = spritesGroup.create(otherData.data.x, otherData.data.y, 'player', spritemap[otherData.data.color].down.start+1);
    other.uid = otherData.uid;
    //other.body.collideWorldBounds = true;
    other.body.immovable = true;
    other.body.setSize(17, 18, false);
    other.body.setOffset(15, 30);

    other.messageEl = game.add.text(other.x, other.body.y - 52, '', textStyle, textGroup);
    other.messageEl.setOrigin(0.5)
    other.messageEl.setVisible(false);

    otherData.element = other;
    hpBar('add', otherData.element, otherData.data);
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
          other.hpBarEl.destroy();
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
            other.anims.play(otherData.dir+'-'+others[i].data.color, true);
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

  var hpBar = function(action, plyr, data) {
    var bar_w = 100;

    if (action == 'add') {
      plyr.hpBarEl = game.add.graphics({
        x: plyr.x - (bar_w / 2),
        y: plyr.body.y + plyr.body.height + 10
      })
        .lineStyle(1, 0x000000, 0.8)
        .fillStyle(0x00ff00, 0.75)
        .fillRect(0, 0, bar_w, 8)
        .strokeRect(0, 0, bar_w, 8);
    } else if (action == 'update') {
      if (plyr.hpBarEl) {
        var width = data.hp / 1000 * bar_w
        //console.log(width)
        plyr.hpBarEl.setPosition(plyr.x - (bar_w/2), plyr.body.y + plyr.body.height + 10)
        .fillStyle(0x000000)
        .fillRect(0, 0, bar_w, 8)
        .fillStyle(0x00ff00, 0.75)
        .fillRect(0, 0, width, 8)
      }
    }
  };

  //
  var renderMessage = function(plyr, message) {
    if (plyr.messageTimeout) clearTimeout(plyr.messageTimeout)
    plyr.messageEl.setText(message);
    plyr.messageEl.setVisible(true);
    plyr.messageTimeout = setTimeout(function(){
      plyr.messageEl.setText('');
      plyr.messageEl.setVisible(false);
    }, 10 * 1000);
  };

  //// ITEM functions
  var addItem = function(itemData){
    var item = itemsGroup.create(itemData.x, itemData.y, 'food', foodSpritemap[itemData.type].start);
    item.uid = itemData.uid;
    item.play(itemData.type, true);
    //console.log('item @ '+item.x+','+item.y);
  };

  var playerGotItem = function(plyr, item){
    removeItem(item);
    socket.emit('got-item', {player: playerData, item_uid: item.uid});
  }

  var otherGotItem = function(item_uid){
    itemsGroup.children.each(function(entry){
      if (entry.uid == item_uid) {
        removeItem(entry);
      }
    });
  }

  var removeItem = function(item){
    item.destroy();
  };

  //// throw functions
  var throwHit = function() {
    if (playerData.throwing) {
      return
    }
    playerData.throwing = true;
    renderThrow(player, {dir: playerData.dir});
    socket.emit('user-throw', {player: playerData});
    setTimeout(function(){
      playerData.throwing = false;
    }, 1000 / 5);
  };

  var renderThrow = function(plyr, data, callback) {
    var type = 'tomato'
    var pos_x;
    var pos_y;
    if (data.dir == 'left') {
      pos_x = plyr.x - plyr.body.width;
      pos_y = plyr.y;
    } else if (data.dir == 'right') {
      pos_x = plyr.x + plyr.body.width;
      pos_y = plyr.y;
    }else if (data.dir == 'up') {
      pos_x = plyr.x;
      pos_y = plyr.y - plyr.body.height - 10;
    } else { //if (data.dir == 'down')
      pos_x = plyr.x;
      pos_y = plyr.y + plyr.body.height + 10;
    }
    var hit = hitGroup.create(pos_x, pos_y, 'food', foodSpritemap[type].start);
    hit.player_uid = plyr.uid;
    hit.play(type, true);
    var vel = 500
    //
    if (data.dir == 'left') {
      hit.setVelocity(-1*vel, 0);
    } else if (data.dir == 'right') {
      hit.setVelocity(vel, 0);
    }else if (data.dir == 'up') {
      hit.setVelocity(0, -1*vel);
    } else { //if (data.dir == 'down')
      hit.setVelocity(0, vel);
    }
    setTimeout(function(){
      if (callback) callback(hit);
      hit.destroy();
      // TODO animate hit decay
    }, 1 * 1000);
  };

  var playerHit = function(plyr, obj){
    if (plyr.uid == obj.player_uid) return;
    obj.destroy();
    game.tweens.addCounter({
      from: 0,
      to: 255,
      duration: 300,
      onUpdate: function (tween) {
        var value = tween.getValue();
        plyr.setTint(Phaser.Display.Color.GetColor(255, value, value));
      },
      onComplete: function(tween) {
        plyr.clearTint();
      }
    });
    if (plyr.uid == player.uid) socket.emit('user-hit', {player: playerData});
    if (obj.player_uid == player.uid) playerData.throwing = false;
  }

  var animateCamera = function(g) {
    //set moving camera
    var points = [
      {x: map.widthInPixels, y: 0},
      {x: map.widthInPixels, y: map.heightInPixels},
      {x: 0, y: map.heightInPixels},
      {x: 0, y: 0}
    ]
    var pointsIdx = -1;
    var duration = 20 * 1000;
    var panCam = function(){
      if (pointsIdx == (points.length-1)) {
        pointsIdx = 0;
      } else {
        pointsIdx += 1;
      }
      game.cameras.main.pan(points[pointsIdx].x, points[pointsIdx].y, duration, 'Linear', true);
    };
    cameraAnimation = setInterval(panCam, duration);
    panCam();
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
        others.push({uid: data.players[i].uid, data: data.players[i]});
      }
      console.log(others.map(function(i){ return i.data }));
      trigger('players-change', [others.map(function(i){ return i.data })]);
      for (var i = 0; i < data.items.length; i++) {
        items.push(data.items[i]);
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
        scene: [world]
      });
      trigger('load', [playerData]);

      /// Add window resize listener
      window.addEventListener('resize', function (event) {
        phaser.scale.resize(window.innerWidth, innerHeight);
      }, false);
    });

    // user joins
    socket.on('user-join', function( data ) {
      if(playerData && data.player.uid != playerData.uid){
        var otherObj = {uid: data.player.uid, data: data.player}
        addOther(otherObj);
        others.push(otherObj);
      }
      trigger('players-change', [data.players]);
    });
    /// user exits
    socket.on('user-exit', function( data ) {
      //console.log('--EXIT--');
      trigger('players-change', [data.players]);
      for (var i = 0; i < others.length; i++) {
        if(data.player.uid == others[i].uid){
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

    socket.on('other-throw', function(data){
      for(var i = 0; i<others.length; i++){
        if (data.player.uid == others[i].uid){
          renderThrow(others[i].element, {dir: data.player.dir});
        }
      }
    });

    socket.on('new-item', function(item){
      items.push(item);
      addItem(item);
    });

    socket.on('item-gone', function(item){
      otherGotItem(item.uid);
    });

    socket.on('player-dead', function(data){
      // YOU DIED;
      player.setActive(false);
      player.destroy();
      player.messageEl.destroy();
      player.hpBarEl.destroy();
      animateCamera();
      trigger('dead');
    });

    socket.on('message-sent', function(data){
      if (data.uid != playerData.uid) {
        for (var i = 0; i < others.length; i++) {
          if(data.uid == others[i].uid){
            renderMessage(others[i].element, data.message);
          }
        }
      }
      trigger('message', [data.name, data.message]);
    });

    socket.on('update', function(data){
      //console.log('--UPDATE--');
      if (data.players) {
        trigger('players-change', [data.players]);
        for (var p = 0; p < data.players.length; p++) {
          var pl = data.players[p];
          if (pl.uid == playerData.uid) {
            if (playerData.scale != pl.scale) player.setScale(pl.scale);
            console.log("plDt="+playerData.speed+"->"+pl.speed);
            playerData = pl;
            continue;
          }
          for (var i = 0; i < others.length; i++) {
            if(pl.uid == others[i].uid){
              if (others[i].data.scale != pl.scale) others[i].element.setScale(pl.scale);
              others[i].data = pl;
              break;
            }
          }
        }

      }else if(data.player){
        for (var i = 0; i < others.length; i++) {
          if(data.player.uid == others[i].uid){
            others[i].data = data.player;
          }
        }
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
      var msg = text.substring(0,55)
      renderMessage(player, msg);
      socket.emit('user-message', {name: playerData.name, uid: playerData.uid, message: msg});
    }
  };

  /// add event listener
  this.on = function(event, callback) {
    events[event] = callback;
  };
};
