var client = new function(){
  // private
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
    //Game.initGame();
    game = idlechase.initGame($('#content-wrapper').width(), $('#content-wrapper').height(), playerData);
    $('#initial-splash').remove();
    $('#content-wrapper').show();
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

};