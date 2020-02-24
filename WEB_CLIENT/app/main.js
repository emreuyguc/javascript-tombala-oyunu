

const API_SERVER = "http://192.168.1.3:85/";
const GAME_SERVER = "http://192.168.1.3:85/";

const roomSocket = io.connect(GAME_SERVER + "beklemeSalonu");

var roomCard = '<div class="col-xl-3 col-lg-4 col-md-6 col-sm-12 col-xs-12 text-left small pb-3" id="@@roomId"> \
              <div class="listroom rounded" onclick="window.location=\'@@roomLink\'" style="cursor: pointer;"> \
                  <div class="prize rounded bg-danger"> \
              <div class="buybt rounded">Odaya Katıl</div> \
                      <div class="money">@@cardPrice ₺</div> \
                  </div> \
                  <div class="detail"> \
                      <h3>@@roomName</h3> \
                      <div class="text-success"></div> \
                      <div class="type text-success">@@ownerDividend</div> \
                      <div class="type text-gray">@@playerCount Kişi Oyunda</div> \
                  </div> \
                  <div class="awards clearfix small"> \
                      <div class="award"> \
                          <div class="key">1.ÇİNKO</div> \
                          <div class="val">@@firstPrize</div> \
                      </div> \
                      <div class="award"> \
                          <div class="key">2.ÇİNKO</div> \
                          <div class="val">@@secondPrize</div> \
                      </div> \
                      <div class="award">\
                          <div class="key">TOMBALA</div>\
                          <div class="val">@@lottoPrize</div>\
                      </div>\
                      <div class="award">\
                          <div class="key">TULUM</div>\
                          <div class="val">@@uniqPrize</div>\
                      </div>\
                  </div>\
              </div>\
              </div>\
              ';

/*  APİ SERVER */
if(typeof localStorage.userKey != "null" && typeof localStorage.userKey != "undefined"){
  userKeyLogin();
}

function userKeyLogin(){
  $.post(API_SERVER + 'userKeyLogin',
  {
    userKey : localStorage.userKey
  },
  function(userData, status){
    if(userData != null){
      //Login Activates
      $('#unsigned').html('');
      $('#signed').html('\
      <span class="navbar-text mr-3">Hoşgeldin '+ userData.userName +' <b id="balance"> | Bakiyeniz : '+ userData.userBalance +'</b> ₺</span> \
      <button class="btn btn-outline-success btn-sm mr-3" data-target="#roomCreateModal" data-toggle="modal">Yeni Oda</button> \
      <button class="btn btn-outline-danger btn-sm" onclick="userExit()">Çıkış</button> \
      ');
      //Login Activates 
    }
    else{
      
    }
  });
}
function userLogin(username , password){
  $.post(API_SERVER + 'userLogin',
  {
    username: username,
    password: password
  },
  function(response, status){
    if(typeof response.userKey != "undefined"){
      localStorage.userKey = response.userKey;
      location.reload();
    }else{
      alert(response.errMsg);
    }
  });
}
function userRegister(username,password,email){
  $.post(API_SERVER + 'userRegister',
  {
    username: username,
    password: password,
    email : email
  },
  function(response, status){
    localStorage.userKey = response.userKey
    location.reload();
  });
}
function userExit(){
  localStorage.removeItem('userKey');
  location.reload();
}
/*  APİ SERVER */



/* SOCKET SERVER */
roomSocket.on('connect', function(){

  roomSocket.on('rooms', function(rooms){
    $('#rooms').html('');
    rooms.forEach(roomData => {
      $('#rooms').append(
        roomCardReplace(roomData)
      );
    });
  });

  roomSocket.on('roomOpened', function(roomData){
    let roomElement = $("#rooms").find("[id='" + roomData.roomId + "']")[0];
    if(roomElement == undefined){
      $('#rooms').prepend(
        roomCardReplace(roomData)
      );
    }
  });

  roomSocket.on('roomClosed', function(roomId){
    let closedRoomElement = $("#rooms").find("[id='" + roomId + "']")[0];
    closedRoomElement.remove();
  });

});
function roomCreate(roomName ,cardPrice , ownerDividend){
  roomSocket.emit('createRoom',
  {
    userKey : localStorage.userKey,
    roomName : roomName,
    cardPrice : cardPrice,
    ownerDividend : ownerDividend
  },function(response){
    if(response != null){
      location.href = response.roomLink;
    }
  });
}

/*
JOİN ROOM 
-->USERKEY ROOM ID   OWNER KONTROLER
USERKEY KONTROL

SADECE VİEWER

*/
function roomCardReplace(roomData){
  return(roomCard
    .replace("@@roomName",roomData.roomName)
    .replace("@@roomId",roomData.roomId)
    .replace("@@playerCount",roomData.playerCount)
    .replace("@@roomLink",roomData.roomLink)
    .replace("@@ownerDividend",roomData.ownerDividend)
    .replace("@@cardPrice", roomData.cardPrice)
    .replace("@@firstPrize",roomData.firstPrize)
    .replace("@@secondPrize",roomData.secondPrize)
    .replace("@@lottoPrize",roomData.lottoPrize)
    .replace("@@uniqPrize",roomData.uniqPrize));
}
/* SOCKET SERVER */



