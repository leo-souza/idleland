var idlechase = new function(){
  //private
  var game = null;
  var player;
  var others = [];
  var playerData;
  var spritesGroup;
  var textGroup;
  var frameRate = 12;
  var cursors;
  var cameraAnimation;
  var scene = {

    preload: function() {
      this.load.tilemapTiledJSON('map', '/map/map.json');
      this.load.spritesheet('tileset', '/map/tileset.png', {frameWidth: 32, frameHeight: 32});
      this.load.spritesheet('trees', '/map/trees.png', {frameWidth: 32, frameHeight: 32});
      this.load.spritesheet('player', '/sprites/sprites.png', {frameWidth: 48, frameHeight: 48});
      this.load.spritesheet('food', '/sprites/food.png', {frameWidth: 32, frameHeight: 32});
      //this.load.spritesheet('gamepad', '/sprites/gamepad_spritesheet.png', 100, 100);
    },

    create: function() {
      var map = this.make.tilemap({ key: 'map' });
      var tiles = map.addTilesetImage('boulders', 'tileset');
      var trees = map.addTilesetImage('trees', 'trees');

      this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
      this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

      /// Create layers
      map.createStaticLayer('base', tiles);
      map.createStaticLayer('background', trees);
      collisionLayer = map.createDynamicLayer('collision', trees);
      collisionLayer.visible = false;
      collisionLayer.setCollisionByExclusion([-1]);

      spritesGroup = this.physics.add.group();

      //addPlayer(this);
      //for (var i = 0; i < others.length; i++) {
      //  others[i].element = Game.addOther(others[i]);
      //}

      map.createStaticLayer('foreground', trees);

      textGroup = this.physics.add.group();

      createAnimations(this);

      if ($(window).width() < 768){
        //var gamepad = game.plugins.add(Phaser.Plugin.VirtualGamepad);
        //Game.joystick = gamepad.addJoystick($(window).width()/2, $(window).height() - 100, 0.75, 'gamepad');
        //Game.button = gamepad.addButton(0, 0, 0, 'gamepad')
      }

      this.physics.add.collider(collisionLayer, player);
      this.physics.add.collider(spritesGroup, player);

      // this.input.onDown.add(function(){
      //   $('#textbox').blur();
      //   $('#userlist').removeClass('open');
      // });
      //game.debug.body(player);
      this.events.on('resize', scene.resize, this);
      cursors = this.input.keyboard.createCursorKeys();

      /// set moving camera before player joins
      var points = [
        {x: map.widthInPixels, y: 0},
        {x: map.widthInPixels, y: map.heightInPixels},
        {x: 0, y: map.heightInPixels},
        {x: 0, y: 0}
      ]
      var pointsIdx = -1;
      var duration = 20 * 1000;
      var that = this;
      var panCam = function(){
        if (pointsIdx == (points.length-1)) {
          pointsIdx = 0;
        } else {
          pointsIdx += 1;
        }
        that.cameras.main.pan(points[pointsIdx].x, points[pointsIdx].y, duration, 'Linear', true);
      };
      cameraAnimation = setInterval(panCam, duration);
      panCam();
    },

    update: function(){
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

      if (dir.length > 0){
        //socket.emit('user-moving', {uid: playerData.uid, dir: dir, x: player.body.x, y: player.body.y});
        playerData.moving = true;
      }else{
        if (playerData.moving) {
          //socket.emit('user-stop', {uid: playerData.uid});
        }
        playerData.moving = false;
      }

      if (playerData.message && playerData.messageEl) {
        playerData.messageEl.setText(playerData.message);
        playerData.messageEl.setPosition(player.body.x, player.body.y - 52);
      }
      for (var o = 0; o < others.length; o++) {
        var other = others[o];
        if(other.element && other.element.messageEl && other.message) {
          other.element.messageEl.setText(other.message);
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

  var spritemap = {
    yellow: {left: {start: 12, end: 14}, right: {start: 24, end: 26}, up: {start: 36, end: 38}, down: {start: 0, end: 2}},
    brown: {left: {start: 21, end: 23}, right: {start: 33, end: 35}, up: {start: 45, end: 47}, down: {start: 9, end: 11}},
    gray: {left: {start:18, end: 20}, right: {start: 30, end: 32}, up: {start: 42, end: 44}, down: {start: 6, end: 8}},
    orange: {left: {start: 15, end: 17}, right: {start: 27, end: 29}, up: {start: 39, end: 41}, down: {start: 3, end: 5}},
    green: {left: {start: 60, end: 62}, right: {start: 72, end: 74}, up: {start: 84, end: 86}, down: {start: 48, end: 50}}
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

  //public
  this.addPlayer = function(plDta){
    playerData = plDta;

    player = spritesGroup.create(playerData.x, playerData.y, 'player', spritemap[playerData.color].down.start);
    //player = game.physics.add.sprite(playerData.x, playerData.y, 'player', spritemap[playerData.color].down.start);
    scene = game.scene.getScene('default');
    playerData.messageEl = scene.add.text(player.body.x, player.body.y - 50, '', {
      font: "18px Arial",
      fill: "#fff",
      align: "left"
    }, textGroup);

    player.body.collideWorldBounds = true;
    //player.body.immovable = true;
    player.body.setSize(17, 18, false);
    player.body.setOffset(15, 30);

    clearInterval(cameraAnimation);
    scene.cameras.main.startFollow(player);
  };

  this.initGame = function(w, h, plDta){
    if (game) return game;

    //playerData = plDta;

    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: 'game',
      width: w,
      height: h,
      autoResize: true,
      physics: {
        default: 'arcade'
      },
      scene: scene
    });

    window.addEventListener('resize', function (event) {
      var gameWrap = document.getElementById("game");
      game.resize(gameWrap.offsetWidth, gameWrap.offsetHeight);
    }, false);

    return game;
  };
};