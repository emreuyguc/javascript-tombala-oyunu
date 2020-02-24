class Tombala {
    constructor() {
        this.stage = new Konva.Stage({
            x:0,
            container: 'game',
            width: window.innerWidth,
            height: window.innerHeight,
            fill : "black"
        });
        this.gameLayer = new Konva.Layer();
    }

    addCard(cardInfo) {
        var card = new Konva.Group({
            id: cardInfo.cardId,
            name:	cardInfo.userName,
            x: cardInfo.x,
            y: cardInfo.y,
            //draggable: true
        });

        var cardRect  = new Konva.Rect({
            width: cardInfo.cardWidth,
            height: cardInfo.cardHeight, 
            fill: "green",
            stroke: cardInfo.borderColor,
            strokeWidth: 2
        });

        card.add(cardRect);

        let gY = 0;
        let numC = 0;
        let boxColor;
        let yaz;
        for (let i = 0; i < 3; i++) {
            let gX = 0;
            for (let d = 0; d < 9; d++) {
                yaz = false;
                if(i % 2 == 0){
                    if(d % 2 == 0){
                        boxColor = cardInfo.activeColor;
                        yaz = true;
                    }
                    else{
                        boxColor = cardInfo.deactiveColor;
                    }
                }
                else{
                    if(d % 2 != 0 || d == 0){
                        boxColor = cardInfo.activeColor;
                        yaz = true;
                    }
                    else{
                        boxColor = cardInfo.deactiveColor;
                    }
                }
                                            

                card.add(new Konva.Rect({
                        x: gX+1,
                        y: gY+1,
                        width: cardInfo.cardWidth * 0.1150, 
                        height: cardInfo.cardHeight * 0.25, 
                        fill: boxColor,
                        stroke: cardInfo.borderColor,
                        strokeWidth: 0,
                        name :  yaz == true ? 'kutu_' + cardInfo.numbers[numC] : 'kutu_--',
                    }));
                    
                if(yaz == true){
                    card.add(new Konva.Text({
                    x: gX ,
                    y: gY , //+10
                    text: cardInfo.numbers[numC],
                    id :  'numara_' + cardInfo.numbers[numC],
                    fontSize: ((cardInfo.cardWidth * cardInfo.cardHeight) / 1000 ) * 0.6,
                    fontFamily: 'Nato Sans',
                    fill: '#fff',
                    width: cardInfo.cardWidth * 0.114, 
                    height: cardInfo.cardHeight * 0.25, 
                    align : "center",
                    verticalAlign : "middle",
                    stroke:	'#fff',
                    strokeEnabled: true,
                    strokeWidth: 1
                    }));
                    numC++;
                }

                gX +=cardInfo.cardWidth * 0.1097; 

            }
            gY += cardInfo.cardHeight * 0.25  -1; 
        }
        
        card.add(new Konva.Rect({
            x : 1,
            y : (cardInfo.cardHeight * 0.256) * 2.9, 
            width: cardInfo.cardWidth-2, 
            height: cardInfo.cardHeight * 0.257, 
            fill: "#6C5B7B",
        }));
        
        card.add(new Konva.Text({
            x: 1,
            y:  cardInfo.cardHeight * 0.65, 
            text: cardInfo.userName,
            fontSize: 18,
            fontFamily: 'Calibri',
            fill: '#fff',
            width: cardInfo.cardWidth-2, 
            padding: cardInfo.cardHeight * 0.65 / 4.5,
            align: 'center'
            })
        );

        var sitButton = new Konva.Group({
            id:	"sitButton",
            name : cardInfo.cardId,
            x : (cardInfo.cardWidth * 0.256),
            y : (cardInfo.cardHeight * 0.9), 
        });
        
        sitButton.add(new Konva.Rect({
            width: cardInfo.cardWidth / 2, 
            height: (cardInfo.cardHeight * 0.257) / 2, 
            fill: "YELLOW",
        }));
        sitButton.add(new Konva.Text({
            x: 10,
            y:  0, 
            text: "Oturmak İçin Tıkla",
            fontSize: 18, 
            fontFamily: 'Calibri',
            fill: '#000',
            align: 'center',
            padding: cardInfo.cardHeight * 0.65 / 20.5, 
            })
        )

        let thisClass = this;
        sitButton.on('mousedown', function() {
            thisClass.sitFunction(this);
        });

        card.add(sitButton);
        this.gameLayer.add(card);
        this.stage.add(this.gameLayer);
    }   
}