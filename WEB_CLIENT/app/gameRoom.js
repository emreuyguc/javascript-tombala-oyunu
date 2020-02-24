	var $_GET = {};
if(document.location.toString().indexOf('?') !== -1) {
	var query = document.location	// (thanks, @vrijdenker)
				.toString()
				.replace(/^.*?\?/, '')
				.replace(/#.*$/, '')
				.split('&');
		for(var i=0, l=query.length; i<l; i++) {
	var aux = decodeURIComponent(query[i]).split('=');
	$_GET[aux[0]] = aux[1];
	}
}

const gameSocket = io.connect("http://192.168.1.3:85/oyunSalonu");

	gameSocket.emit('userAuth',{
		'roomId' : $_GET['r'],
		'userKey' : localStorage.userKey
	},function(response){
		//GAME SETUP
			var oyun = new Tombala();

			oyun.sitFunction = function(e){
				gameSocket.emit('takeCard',
						{
							"roomId" : $_GET['r'],
							"userKey" : localStorage.userKey,
							"cardId" : e.attrs.name
						}
				);
			}


			var chatLayer = new Konva.Layer();
			chatLayer.add(new Konva.Text({
					id : "mesaj",
					x: window.innerWidth * 0.105,
					y:  window.innerHeight * 0.4, //130
					text: "CHAT",
					fontSize: 50, //18
					fontFamily: 'Calibri',
					fill: '#FFF',
					width: 600, //300
					padding: 0, //20
					align: 'center'
					}));
			oyun.stage.add(chatLayer);

			var buttonsLayer = new Konva.Layer();
			oyun.stage.add(buttonsLayer);

			var cekBtn = new Konva.Label({
			x: window.innerWidth * 0.273,
			y: window.innerHeight * 0.35,
			opacity: 1	
			});
			cekBtn.add(new Konva.Tag({
			fill: 'red',
			lineJoin: 'round',
			shadowColor: 'black',
			shadowBlur: 10,
			shadowOffset: 10,
			shadowOpacity: 80
			}));
			cekBtn.add(new Konva.Text({
			text: 'ÇEK',
			fontFamily: 'Calibri',
			fontSize: 40,
			padding: 5,
			fill: 'white'
			}));

			var baslaBtn = new Konva.Label({
				x: window.innerWidth * 0.4,
				y: window.innerHeight * 0.35,
				opacity: 1	
				});
				baslaBtn.add(new Konva.Tag({
				fill: 'red',
				lineJoin: 'round',
				shadowColor: 'black',
				shadowBlur: 10,
				shadowOffset: 10,
				shadowOpacity: 80
				}));
				baslaBtn.add(new Konva.Text({
				text: 'BAŞLA',
				fontFamily: 'Calibri',
				fontSize: 40,
				padding: 5,
				fill: 'white'
				}));
	


			
			let cY = 20;
			let i = 0;
			for(let row = 0; row < 3; row++){
				if(row % 2 != 0){
					oyuncuYerlesim = 2
				}
				else{
					oyuncuYerlesim = 4
				}
				let cX = window.innerWidth / 25;
				for(let oyuncu = 0; oyuncu < oyuncuYerlesim; oyuncu++){
					i++;
					//CODE DUPLICATE
					let playerCard = {};
					playerCard.borderColor = "black";
					playerCard.deactiveColor = "grey";
					playerCard.activeColor = "#222";
					playerCard.cardId = i.toString();
					playerCard.userName = "Oyuncu_"+i;
					playerCard.numbers = [];
					playerCard.cardWidth = window.innerWidth / 4.5;
					playerCard.cardHeight = window.innerHeight / 3.5;
					playerCard.x = cX; 
					playerCard.y = cY;
					//CODE DUPLICATE

					cX += row % 2 != 0 ?  window.innerWidth * 0.698 : window.innerWidth / 4.3;
					oyun.addCard(playerCard);
				}
				cY += window.innerHeight * 0.32;
			}
			oyun.stage.draw();
		//GAME SETUP



		for(let i = 0; i<response.players.length; i++){
			let player = response.players[i]
			let oldCardInfo = oyun.stage.find('#'+player.cardId)[0].attrs;
			
			//CODE DUPLICATE

			let playerCard = {};
			playerCard.borderColor = "black";
			playerCard.deactiveColor = "grey";
			playerCard.cardWidth = window.innerWidth / 4.5;
			playerCard.cardHeight = window.innerHeight / 3.5;
			playerCard.cardId = oldCardInfo.id;
			playerCard.x = oldCardInfo.x; 
			playerCard.y = oldCardInfo.y; 



			playerCard.activeColor = player.activeColor;
			playerCard.userName = player.nick;
			playerCard.numbers = player.numbers;


			oyun.stage.find('#'+player.cardId).remove();
			oyun.addCard(playerCard);
			oyun.stage.find('.'+player.cardId).remove();
			oyun.stage.draw();
						//CODE DUPLICATE

		}





		if(response.gameStart == true){
			oyun.stage.find('#sitButton').remove()
			oyun.stage.draw();

		}

		if(response.authority == "admin"){
			oyun.admin = true;
			oyun.stage.find('#sitButton').remove()

			buttonsLayer.add(baslaBtn);
			cekBtn.on('click', () => {
				alert('clicked on canvas button');
			});
			baslaBtn.on('click', (e) => {
				alert("h");
/*

				gameSocket.emit('gameStart',{
					"userKey":localStorage.userKey,
					"roomId": $_GET['r']
				},function(response){
					if(response == true){
						e.target.parent.remove();
						buttonsLayer.add(cekBtn);
						buttonsLayer.draw();
					}
				});
*/
			});
			oyun.stage.draw();
			//admin
		}

		gameSocket.on('playerSit',function(msg){
			let oldCardInfo = oyun.stage.find('#'+msg.cardId)[0].attrs;
			
			//CODE DUPLICATE

			let playerCard = {};
			playerCard.borderColor = "black";
			playerCard.deactiveColor = "grey";
			playerCard.cardWidth = window.innerWidth / 4.5;
			playerCard.cardHeight = window.innerHeight / 3.5;
			playerCard.cardId = oldCardInfo.id;
			playerCard.x = oldCardInfo.x; 
			playerCard.y = oldCardInfo.y; 
			//CODE DUPLICATE


			playerCard.activeColor = msg.activeColor;
			playerCard.userName = msg.nick;
			playerCard.numbers = msg.numbers;

			//CODE DUPLICATE
			oyun.stage.find('#'+msg.cardId).remove();
			oyun.addCard(playerCard);
			oyun.stage.find('.'+msg.cardId).remove();
			oyun.stage.draw();
			//CODE DUPLICATE
		});

		gameSocket.on('playerLeft',function(cardId){
			let oldCardInfo = oyun.stage.find('#'+cardId)[0].attrs;

			//CODE DUPLICATE
			let playerCard = {};
			playerCard.borderColor = "black";
			playerCard.deactiveColor = "grey";
			playerCard.activeColor = "#222";
			playerCard.numbers = [];
			playerCard.userName = "Oyuncu";
			playerCard.cardWidth = window.innerWidth / 4.5;
			playerCard.cardHeight = window.innerHeight / 3.5;
			//CODE DUPLICATE

			playerCard.cardId = oldCardInfo.id;
			playerCard.x = oldCardInfo.x; 
			playerCard.y = oldCardInfo.y;

			//CODE DUPLICATE
			oyun.stage.find('#'+cardId).remove();
			oyun.addCard(playerCard);

			if(oyun.admin == true){
				oyun.stage.find('#sitButton').remove()
			}
			oyun.stage.draw();
			//CODE DUPLICATE
		});

	});
