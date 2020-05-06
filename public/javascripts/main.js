$(document).ready(function(){

  var view = new function(){
    //private
    var $cont = $('#msgbox .content'),
        $parent = $cont.parent(),
        $userlist = $('#userlist'),
        $status = $('#status');

    //functions
    var animateTop = function(){
      $cont.animate({bottom: 0}, 180);
    };
    var removeExcess = function(){
      var size = $cont.find(' > *').length;
      $cont.find(' > *:lt('+(size > 10 ? size - 10 : 0)+')').remove();
    };

    var renderUserInfo = function(user) {
      return '<div class="user-info"><span class="color '+user.color+'"></span><span class="name">'+user.name+'</span><span class="pts">💀 '+user.kills+' ✝ '+user.deaths+'</span></div>';
    }

    //public
    this.updateList = function(list){
      var sorted = list.sort(function (a, b) {
        if (a.kills > b.kills) {
          return -1;
        }
        if (a.kills < b.kills) {
          return 1;
        }
        return 0;
      });
      $userlist.html(
        $.map(sorted, function(user){
          if ($status.data('uid') && user.uid == $status.data('uid')) view.updateStatus(user);
          return renderUserInfo(user);
        }).join('')
      );
    };

    this.updateStatus = function(data){
      //$status.html(JSON.stringify(data));
      $status.html(renderUserInfo(data)+
                   '<div id="hp-bar">'+
                     '<div class="bar"></div>'+
                     '<div class="mask" style="width: '+(((data.hp-1000)*-1)/1000 * 100)+'%;"></div>'+
                    '</div>');
      $status.data('uid', data.uid);
    };

    this.createMessage = function(name, msg){
      $cont.css({bottom: -22});
      $cont.append(
        '<div><b>'+name+':</b> '+msg+'</div>'
      );
      animateTop();
      removeExcess();
    };

    this.renderDead = function(grave){
      $('body').append('<div class="center-msg-big">'+
      '<div class="head-text">Game Over</div>'+
      '<div class="sub-text">Killed by '+grave.killer.name+'</div>'+
      '<a href="#" class="btn re-join">Play Again</a>'+
      '</div>');
    };
  };

  //// Enter event handler
  $('#enter-form').submit(function(){
    var $this = $(this);
    var name = $this.find('#name-input').val();
    var color = $this.find('[name=avatar-input]:checked').val();
    $this.find('.btn-enter').attr('disabled', true).text('Loading...');
    // Init game!
    idlechase.initGame(name, color, {
      width: window.innerWidth,
      height: window.innerHeight
    });
    return false;
  });

  $(document).on('click', '.re-join', function(e) {
    e.preventDefault();

    idlechase.reinit();

    return false;
  });

  //// 'c' -> Focus on textbox
  document.body.addEventListener("keyup", function (e) {
    if (e.key == 'c'){
      document.getElementById('textbox').focus();
    }
    if (e.keyCode == 27){ // Esc
      document.getElementById('textbox').blur();
    }
  });
  /// textbox - enter - send message
  document.getElementById('textbox').addEventListener("keyup", function (e) {
    if (e.keyCode == 13){ //Enter
      idlechase.issueCommand(this.value);
      this.value = null;
    }
  });

  $('#userlist').click(function(){
    $(this).toggleClass('open');
    return false;
  });

  idlechase.on('canvas-click', function(){
    $('#textbox').blur();
    $('#userlist').removeClass('open');
  });

  idlechase.on('players-change', function(players){
    view.updateList(players);
  })

  idlechase.on('update-player', function(player){
    view.updateStatus(player);
  })

  idlechase.on('load', function(player_data){
    $('#initial-splash').remove();
    $('#overlay').remove();
    $('.center-msg-big').remove();
    $('#content-wrapper').show();
    view.updateStatus(player_data)
  });

  idlechase.on('message', function(name, text) {
    view.createMessage(name, text);
  });

  idlechase.on('dead', function(grave) {
    view.renderDead(grave);
  });

});
