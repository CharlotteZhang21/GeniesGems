import * as Util from '../utils/util';

class DarkOverlay extends Phaser.Group {
    constructor(game) {
        super(game);

        this.graphics = game.add.graphics(0, 0);

        this.graphics.beginFill(0x000000, 1);

        this.graphics.drawRect(
            0,
            0,
            window.innerWidth * window.devicePixelRatio,
            window.innerHeight * window.devicePixelRatio);

        this.add(this.graphics);

        this.finalAlpha = 0;

        this.alpha = 0;

        this.game.add.existing(this);
    }

    show() {
        Util.fade(this, this.finalAlpha, 300);
    }

    hide() {
        Util.fade(this, 0, 300);
    }
}

export default DarkOverlay;