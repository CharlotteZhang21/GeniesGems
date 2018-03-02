import Settings from '../../settings';

class Fox extends Phaser.Group {
	//initialization code in the constructor
    constructor(game, board) {

        super(game);

        this.board = board;

        this.createFox();

        // this.playAnimation(this.status);

    }

    createFox() {
 		//start (0,4)
        this.x = Settings.fox.startX;
        this.y = Settings.fox.startY;
        this.moveDuration = Settings.fox.moveDuration;
    	// this.x = this.board.x + this.board.tileWidth * Settings.fox.startX;
        // this.y = this.board.y + this.board.tileWidth * Settings.fox.startY;
    }

    updatePosition(_x, _y) {
        this.x += _x;
        this.y += _y;
    }


}

export default Fox;