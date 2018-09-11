var idlechase = new function(){
  //private
  var game = null;
  var player;
  var others = [];
  var playerData;
  var spritesGroup;
  var frameRate = 12;
  var cursors;
  var scene = {

    preload: function() {
      this.load.tilemapTiledJSON('map', '/map/map.json');
      this.load.spritesheet('tileset', '/map/tileset.png', {frameWidth: 32, frameHeight: 32});
      this.load.spritesheet('trees', '/map/trees.png', {frameWidth: 32, frameHeight: 32});
      this.load.spritesheet('player', '/sprites/sprites.png', {frameWidth: 48, frameHeight: 48});
      //this.load.spritesheet('gamepad', '/sprites/gamepad_spritesheet.png', 100, 100);
      //this.scale.scaleMode = Phaser.ScaleManager.RESIZE;
    },

    create: function() {
      var map = this.make.tilemap({ key: 'map' });
      var tiles = map.addTilesetImage('boulders', 'tileset');
      var trees = map.addTilesetImage('trees', 'trees');

      //this.world.setBounds(0, 0, 100*32, 100*32);
      this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
      this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

      /// Create layers
      map.createStaticLayer('base', tiles);
      map.createStaticLayer('background', trees);
      collisionLayer = map.createDynamicLayer('collision', trees);
      collisionLayer.visible = false;
      collisionLayer.setCollisionByExclusion([-1]);

      spritesGroup = this.physics.add.group();

      addPlayer(this);
      //for (var i = 0; i < others.length; i++) {
      //  others[i].element = Game.addOther(others[i]);
      //}

      map.createStaticLayer('foreground', trees);

      // playerData.messageEl = game.add.text(player.body.x, player.body.y - 50, '', {
      //   font: "18px Arial",
      //   fill: "#fff",
      //   align: "left"
      // });

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
      cursors = this.input.keyboard.createCursorKeys();
    },

    update: function(){
      if(!player) return;

      player.body.stop();

      var dir = '';
      if (cursors.left.isDown) {
        player.body.velocity.x = -300;
        player.anims.play('left', true);
        dir = 'left';
      } else if (cursors.right.isDown) {
        player.body.velocity.x = 300;
        player.anims.play('right', true);
        dir = 'right';
      }else if (cursors.up.isDown) {
        player.body.velocity.y = -300;
        player.anims.play('up', true);
        dir = 'up';
      } else if (cursors.down.isDown) {
        player.body.velocity.y = 300;
        player.anims.play('down', true);
        dir = 'down';
      } else {
        player.anims.pause();
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
      if (playerData.moving) //socket.emit('user-stop', {uid: playerData.uid});
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
    }
  };
  var spritemap = {
    yellow: {left: [12, 13, 14], right: [24, 25, 26], up: [36, 37, 38], down: [0, 1, 2]},
    brown: {left: [21, 22, 23], right: [33, 34, 35], up: [45, 46, 47], down: [9, 10, 11]},
    gray: {left: [18,19,20], right: [30,31,32], up: [42,43,44], down: [6,7,8]},
    orange: {left: [15,16,17], right: [27,28,29], up: [39,40,41], down: [3,4,5]},
    green: {left: [60,61,62], right: [72,73,74], up: [84,85,86], down: [48,49,50]}
  };

  var addPlayer = function(g){
    player = spritesGroup.create(playerData.x, playerData.y, 'player', spritemap[playerData.color].down[1]);

    $.each(['left', 'right', 'up', 'down'], function(){
      var c = g.anims.create({
        key: this,
        frames: $.map(spritemap[playerData.color][this], function(n){
          return {key: 'player', frame: n};
        }),
        repeat: -1,
        frameRate: frameRate
      });
      console.log(c);
    });

    // player.animations.add('left', spritemap[playerData.color].left, frameRate, true);
    // player.animations.add('right', spritemap[playerData.color].right, frameRate, true);
    // player.animations.add('down', spritemap[playerData.color].down, frameRate, true);
    // player.animations.add('up', spritemap[playerData.color].up, frameRate, true);

    //g.physics.arcade.enable(player);
    player.body.collideWorldBounds = true;
    //player.body.immovable = true;
    player.body.setSize(15,12,16,32);

    g.cameras.main.startFollow(player);
    //g.camera.follow(player) ; //, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);
  };

  //public
  this.initGame = function(w, h, plDta){
    if (game) return game;

    playerData = plDta;
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: 'game',
      width: w,
      height: h,
      physics: {
        default: 'arcade'
      },
      scene: scene
    });
    return game;
  };
};