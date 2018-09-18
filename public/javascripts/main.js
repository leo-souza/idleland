$(document).ready(function(){

  var view = new function(){
    //private
    var $cont = $('#msgbox .content'),
        $parent = $cont.parent(),
        $userlist = $('#userlist');

    //functions
    var animateTop = function(){
      $cont.animate({bottom: 0}, 180);
    };
    var removeExcess = function(){
      var size = $cont.find(' > *').length;
      $cont.find(' > *:lt('+(size > 10 ? size - 10 : 0)+')').remove();
    };

    //public
    this.updateList = function(list){
      $userlist.html(
        $.map(list, function(user){
          return "<div><span class=\"color "+user.color+"\"></span>"+user.name+"</div>";
        }).join('')
      );
    };

    this.createMessage = function(name, msg){
      $cont.css({bottom: -22});
      $cont.append(
        '<div><b>'+name+':</b> '+msg+'</div>'
      );
      animateTop();
      removeExcess();
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

  //// space -> Focus on textbox
  document.body.addEventListener("keyup", function (e) {
    if(e.keyCode == 32){ //spacebar
      document.getElementById('textbox').focus();
    }
  });
  /// textbox - enter - send message
  document.getElementById('textbox').addEventListener("keyup", function (e) {
    if(e.keyCode == 13){ //Enter
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

  idlechase.on('load', function(){
    $('#initial-splash').remove();
    $('#overlay').remove();
    $('#content-wrapper').show();
  });

  idlechase.on('message', function(name, text) {
    view.createMessage(name, text);
  });

});
