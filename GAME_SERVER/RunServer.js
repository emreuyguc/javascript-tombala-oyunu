const Express = require('express');
const Http = require('http');
const Socket = require('socket.io');
const BodyParser = require('body-parser');
const Crypto = require('crypto');
const RedisClient = require('redis').createClient();
const MongoClient = require('mongoose');

/* INIT */
	const app_http = Express();
	const Server = Http.createServer(app_http);
	const app_socket = Socket(Server);

	app_http.use(BodyParser.urlencoded({ extended: true }));
	app_http.use(BodyParser.json());

	RedisClient.on('connect', function() {
		console.log('Redis client connected');
		//RedisClient.flushall();
		console.log('before data clean  ');
	});
	const beklemeSalonu = app_socket.of('/beklemeSalonu');
	const oyunSalonu = app_socket.of('/oyunSalonu');
/* INIT */


/* DATABASE START */
	const UsersModel = MongoClient.Schema({
		username: { type: String, unique: true, required: true }, 
		password: { type: String, unique: false, required: true }, 
		email: String,
		balance : Number
	});
	const UserModel = MongoClient.model('users', UsersModel);
/* DATABASE END */


/* UTILS START */
	function createKey(data){
		return(Crypto.createHash('md5').update(JSON.stringify(data)).digest('hex'));
	}
	function secureText(text){
		//len kesilcek
		return(text.replace(/[^a-zA-Z ]/g, ""));
	}
/* UTILS END */


/* GAME SERVER START */
	beklemeSalonu.on("connection", (socket)=>{

		RedisClient.HGETALL('rooms', function(err, rooms) {
			if(rooms != null){
				let publicRooms= [];
				Object.keys(rooms).map(function(key) {
					let roomData = JSON.parse(rooms[key]);
					if(roomData.gameStart == false && roomData.players.length < 10){
						roomData.playerCount = roomData.players.length;
						delete roomData.ownerUserKey;
						delete roomData.ownerIp;
						delete roomData.players;
						publicRooms.push(roomData);
					}
				});
				publicRooms.sort((a, b) => (a.createTime > b.createTime) ? -1 : 1)
				socket.emit("rooms",publicRooms);
			}
		});

		socket.on("createRoom",  (roomConfig,response) => {
			//ROOM FLOOD ÖNLEME ZATEN ROOM VARSA YARATMAMA
			if(
				roomConfig.roomName != null && 
				roomConfig.roomName.length != 0 &&
				Number(roomConfig.cardPrice) &&
				Number(roomConfig.ownerDividend)
			){
				UserModel.findOne({
					_id : roomConfig.userKey
				}, (err, roomOwnerUserData) => {
					if (!err) {
						let roomData = {};
						//PRICE CALC
						roomData.cardPrice = Number(roomConfig.cardPrice);
						roomData.firstPrize = roomData.cardPrice * 10;
						roomData.secondPrize = roomData.cardPrice * 20;
						roomData.lottoPrize = roomData.cardPrice * 40;
						roomData.uniqPrize = '-';
						//PRICE CALC

						if(roomOwnerUserData.balance >= (roomData.firstPrize + roomData.secondPrize + roomData.lottoPrize + roomData.cardPrice)){
							roomOwnerUserData.balance -= roomConfig.cardPrice;
							UserModel.findOneAndUpdate({_id : roomOwnerUserData._id },{balance : roomOwnerUserData.balance},function(err,result){
								if(!err){
									roomData.roomName = secureText(roomConfig.roomName);
									roomData.ownerDividend = roomConfig.ownerDividend;
									roomData.ownerUserKey = roomConfig.userKey;
									roomData.createTime = Date.now();
									roomData.ownerIp = socket.handshake.address;
									roomData.players = [];
									roomData.gameStart = false;
									roomData.roomId = createKey(roomData);
									roomData.roomLink = 'game.html?r=' + roomData.roomId,
									RedisClient.SET(roomData.roomId , JSON.stringify(roomData));
									//20 Second for no login
									RedisClient.EXPIRE(roomData.roomId,20,function(err,reply){
										response({
											roomLink : roomData.roomLink
										});
									});
								}
							});
						}
					}
				});
			}
		});

	//JOİN ROOM  VİEWER
		/*
		socket.on("joinRoom", (joinData,response)=>{

		});
		*/


	});

	oyunSalonu.on("connection", (socket)=>{
		socket.on('userAuth', (authData,response) => {
			if( authData.roomId != null && authData.userKey != null){
				RedisClient.GET(authData.roomId,function(err,nonActiveRoomData) {
						if(nonActiveRoomData == null){
							RedisClient.HGET('rooms',authData.roomId,function(err,activeRoomData){
								if(activeRoomData != null){
									roomData = JSON.parse(activeRoomData);
									//İF GAME START ANND PLAYER COUNT ?
									UserModel.findOne({
										_id : authData.userKey
									}, (err, userData) => {
										if (!err) {
											//BU TANIMLAMA NEDEN SOKET ?
											/*
											RedisClient.HMSET('sockets',socket.id,JSON.stringify(
												{
													authority: "user",
													userKey : authData.userKey,
													roomId : authData.roomId
												}
											));

											
											socket.join(roomData.roomId);
											*/
											let roomPlayersPublicData = roomData.players.map(
												playerCard => {
																delete playerCard.userKey
																return playerCard
															}
												);
											response(
												{
													//authority : "user",
													players : roomPlayersPublicData,
													gameStart : roomData.gameStart
												}
											);
										}
									});	
								}
							});
						}
						else{
							roomData = JSON.parse(nonActiveRoomData);
							if(roomData.ownerUserKey == authData.userKey){
								//if admin
								RedisClient.hmset('rooms', roomData.roomId , JSON.stringify(roomData), function(){
									RedisClient.HMSET('sockets',socket.id,JSON.stringify(
										{
											authority: "admin",
											userKey : roomData.ownerUserKey,
											roomId : roomData.roomId
										}
									));
									RedisClient.DEL(roomData.roomId);
									socket.join(roomData.roomId);
									let roomPlayersPublicData = roomData.players.map(
										playerCard => {
														delete playerCard.userKey
														return playerCard
													}
										);
									response(
										{
											authority : "admin",
											players : roomPlayersPublicData,
											gameStart : roomData.gameStart
										}
									);
									beklemeSalonu.emit('roomOpened',{
										roomName : roomData.roomName,
										roomId : roomData.roomId,
										playerCount : roomData.players.length,
										roomLink : 'game.html?r=' + roomData.roomId,
										ownerDividend : roomData.ownerDividend,
										cardPrice : roomData.cardPrice,
										firstPrize : roomData.firstPrize,
										secondPrize : roomData.secondPrize,
										lottoPrize : roomData.lottoPrize ,
										uniqPrize : roomData.uniqPrize
									});
								});
							}
						}
				});
			}
		});

		socket.on('disconnect', function () {
			RedisClient.HGET('sockets',socket.id,function(err,socketData){
				if(socketData != null){
					socketData = JSON.parse(socketData);
					RedisClient.HGET('rooms',socketData.roomId,function(err,roomData){
						if(roomData != null){
							roomData = JSON.parse(roomData);
							if(socketData.authority == 'admin'){
								RedisClient.HDEL('rooms',roomData.roomId);
								RedisClient.SET(roomData.roomId , JSON.stringify(roomData));
								RedisClient.EXPIRE(roomData.roomId,20);
								RedisClient.HDEL('sockets',socket.id);
								beklemeSalonu.emit('roomClosed',roomData.roomId);
								//ADMİN CIKARSA KULLANICYA BİLDİRSN 20 SANİŞYE SAYISN GERİ GELİRSEDE TEKRAR ACSIN
							}
							else{
								RedisClient.HDEL('sockets',socket.id);
								let roomPlayerMatchIndex = roomData.players.findIndex(roomPlayer => roomPlayer.userKey == socketData.userKey);
								if(roomPlayerMatchIndex != -1){
									oyunSalonu.to(roomData.roomId).emit('playerLeft',roomData.players[roomPlayerMatchIndex].cardId);
									roomData.players.splice(roomPlayerMatchIndex,1);
									RedisClient.hmset('rooms', roomData.roomId , JSON.stringify(roomData));
								}
								//EGERKİ OYUN BAŞLADIYSA PLAYERIN CIKTIGINI BİLDİRSİN FAKAT GRİMSİ YAPSIN CIKTI YAZSIN
							}
						}
					});
				}
			});
		});

		socket.on('takeCard',function(userTakeCardRequest,response){
			//burada aslında  userin o odada buldngu
			RedisClient.HGET('rooms',userTakeCardRequest.roomId,function(err,roomData) {
				if(roomData != null){
					roomData = JSON.parse(roomData);
					if(roomData.gameStart == false && roomData.players.length < 10){ 
						UserModel.findOne({
							_id : userTakeCardRequest.userKey
						}, (err, userData) => {
							if (!err) {
								//BAKİY KONTORL
								RedisClient.HMSET('sockets',socket.id,JSON.stringify(
									{
										authority: "user",
										userKey : userData.userKey,
										roomId : roomData.roomId
									}
								));
								socket.join(roomData.roomId);

								let cardIdMatch = roomData.players.find(roomPlayer => roomPlayer.cardId == userTakeCardRequest.cardId);
								if( cardIdMatch == undefined ){
									let userKeyMatchIndex = roomData.players.findIndex(roomPlayer => roomPlayer.userKey == userData.userKey);
									if(userKeyMatchIndex != -1){
										oyunSalonu.to(roomData.roomId).emit('playerLeft',roomData.players[userKeyMatchIndex].cardId);
										roomData.players.splice(userKeyMatchIndex,1);
									}
		
									let playerCard={};
									playerCard.cardId = userTakeCardRequest.cardId
									playerCard.userKey = userData.userKey;
									playerCard.activeColor = "#"+(Math.floor(Math.random() * 999) + 111);
									playerCard.nick = "EMRE";
									playerCard.numbers = [];
									
									for (let i = 0; i < 15; i++) {
										//TEKRAR ETMEYECEK
										playerCard.numbers.push(Math.floor(Math.random() * 90) + 1);
									}
									roomData.players.push(playerCard)
									RedisClient.hmset('rooms',roomData.roomId, JSON.stringify(roomData),function(){
										delete playerCard.userKey
										oyunSalonu.to(roomData.roomId).emit('playerSit',playerCard);
									});
								}

							}
						});
					}
				}
			});
			//GELEN ROOM ID GEREK VARMI ?ZATEN USER KEYDE VAR ANCAK KONTROL ?
			/*
			RedisClient.HGET('users',userTakeCardRequest.userKey,function(err,userData) {
				console.log(userData);
				console.log(userTakeCardRequest)
				if(userData != null){
					userData = JSON.parse(userData);
					
				}
			});
			*/
		});

		socket.on('gameStart',function(admin,response){
			RedisClient.HGET('rooms',admin.roomId,function(err,roomData){
				if(roomData != null){
					roomData = JSON.parse(roomData);
					if(admin.userKey == roomData.adminKey){
						if(roomData.players.length > 1 && roomData.gameStart == false){
							roomData.gameStart = true;
							RedisClient.hmset('rooms', roomData.roomId , JSON.stringify(roomData), function(){
								beklemeSalonu.emit('roomClosed',roomData.roomId);
								response(true);
							});
						}
					}
				}
			});

		});

		//ÇİFT GİRME
		//FLOOD


		//rüm işlwmler socket idsi ile yapılabilr geçici id ile yapılabilir...
		//suanda mesela game start new number ayı anda 2 yerde yapılabilir...
		//take card yapılamaz cunki bi olayı olmaz parası gi,der yada digerine oturur

		//disconnectedi admin cıksada oda gözükyüor.
		//user oda çift girse dahi eski sokceti silecek yenisi eklicek roomdan cıkarcak mesaj gitmicek
		//oda çift girmeye kalkrsa eski socketi silecek yenisini ekleyecegi için eskiyide komple def etsin onu roomdan cıkarsın mesaj gitmesin

		//game start ==> game start ve admin kontrolu,  oda kapandı gözükece, butonlar yerleşecek  , card paraları kesilecek 
		//newNumber ==>  game start ve admin kontrlu, prize odulleri ayrı emit edielecek kontrol edilekece satıra göre ve başka usera göre  ödülelr anında addBalance yada prizeda gidecek
		// take card  ==> buraya belki para ekleneblr,burada satırlar halinde eklenecek numaralaer , oyuncu cıktıtıngda bunlar siliniyor zaten , game start ise take card calısmack ve len kontrol  , admin keyi kontrol ettircek
		//gameEnd
	});
/* GAME SERVER  END */


/* APİ SERVER START */
	app_http.use((req, res, next) => {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Content-Type', 'application/json');
		next();
	});

	app_http.post('/userLogin', function(req, res) {
		if(
			req.body.username != null &&
			req.body.password != null
		){
			UserModel.findOne({
				username : req.body.username,
				password : req.body.password
			}, (err, result) => {
				if (!err) {
					if(result){
						res.json({
							userKey : result._id
						});
						console.log("**Kullanıcı giririşi --> " + result._id);
					}
					else{
						res.json({
							errMsg : "Hata kullanıcı bulunamadı"
						})
					}
				}
			})
		}
	});

	app_http.post('/userRegister', function(req, res) {
		// EMPTY AND LENGHT CONTROL
		if(
			req.body.username != null &&
			req.body.password != null &&
			req.body.email != null
		){
			//SAME USER CONTROLER
			let newUser = UserModel({
				username: req.body.username,
				password: req.body.password,
				email: req.body.email,
				balance : 200
			});
			newUser.save((err, result) => { 
				if (!err) {0
					res.json({
						userKey : result._id
					});
				}
			})
		}
	});

	app_http.post('/userKeyLogin', function(req, res) {
		if(
			req.body.userKey != null
		){
			UserModel.findOne({
				_id : req.body.userKey
			}, (err, result) => {
				if (!err) {
					if(result){
						res.json({
							userName : result.username,
							userBalance : result.balance
						});
						console.log("**Kullanıcı key id --> " + req.body.userKey);
						console.log("**Kullanıcı key username --> " + result.username);
					}
					else{
						res.json({
							errMsg : "Hata kullanıcı bulunamadı"
						})
					}
				}
			});
		}
	});
/* APİ SERVER END */

Server.listen(85, ()=>{
	MongoClient.set('useFindAndModify', false);
	MongoClient.set('useCreateIndex', true);
	MongoClient.set('useNewUrlParser', true);
	MongoClient.set('useUnifiedTopology', true);
	MongoClient.connect('mongodb://127.0.0.1:27017/tombala',err => console.log(err ? err : 'Mongo connected.'));
	console.log("Server başladı")
});

