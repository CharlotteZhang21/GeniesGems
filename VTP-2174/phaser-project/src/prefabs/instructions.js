import * as Util from '../utils/util';
import Localization from '../../localization';
import BoardData from '../board/board';
import DarkOverlay from '../prefabs/dark-overlay';
import FallPieces from '../board/fall-pieces';
import Settings from '../../settings';

class Instructions extends Phaser.Group {

    //initialization code in the constructor
    constructor(game, board) {

        super(game);

        this.board = board;

        this.darkOverlay = new DarkOverlay(this.game);

        game.world.bringToTop(board.bgLayerGrp);
        game.world.bringToTop(board.bottomLayerGrp);
        game.world.bringToTop(board.belowLayerGrp);
        game.world.bringToTop(board.aboveLayerGrp);
        game.world.bringToTop(board.overlayLayerGrp);
        game.world.bringToTop(game.state.states.endcard.cta);

        this.createHighlightBox();
        this.createTutorialHand();
        this.createTooltip();
        this.createArrow();

        this.display(Settings['interaction' + this.game.global.interaction]);
    }

    display(interaction) {

        this.board.overlay.mask = this.getMask(interaction.highlightTiles);

        Util.fade(this.board.overlay, 1, 300);

        this.animateTutorialHand(interaction);
        this.showArrow(interaction);

        this.darkOverlay.show();
        this.board.showOverlay();

        this.setTooltipText(Localization[interaction.tooltip.replace('{{', '').replace('}}', '')]);
        this.showTooltip();
    }

    hide() {

        if (this.game === null) {
            return;
        }

        this.hidden = true;

        var duration = 300;

        Util.fade(this.board.overlay, 0, duration);
        Util.fade(this.arrow, 0, duration);
        Util.fade(this.hand, 0, duration);
        Util.fade(this.highlightBox, 0, duration);
        Util.fade(this.tooltipGrp, 0, duration);

        this.darkOverlay.hide();

        this.game.time.events.add(duration + 50, function() {

            this.mask.clear();
            this.darkOverlay.destroy();
            this.arrow.destroy();
            this.hand.destroy();
            this.highlightBox.destroy();
            this.tooltipGrp.destroy();
            this.destroy();

        }, this);
    }

    getMask(highlightTiles) {

        if (highlightTiles.length < 1 && highlightTiles.length > 2) {
            console.error('invalid amount of highlighted tiles');
            return;
        }

        var rect1 = new Phaser.Rectangle(
            this.board.x + (highlightTiles[0].x * this.board.tileWidth),
            this.board.y + (highlightTiles[0].y * this.board.tileWidth),
            this.board.tileWidth,
            this.board.tileWidth);

        var rect2;

        var mainRect = rect1;

        var isHorizontal = false;

        if (highlightTiles.length === 2) {

            rect2 = new Phaser.Rectangle(
                this.board.x + (highlightTiles[1].x * this.board.tileWidth),
                this.board.y + (highlightTiles[1].y * this.board.tileWidth),
                this.board.tileWidth,
                this.board.tileWidth);

            var isHorizontal = highlightTiles[0].y === highlightTiles[1].y;

            mainRect = new Phaser.Rectangle(
                Math.min(rect1.x, rect2.x),
                Math.min(rect1.y, rect2.y),
                this.board.tileWidth * (isHorizontal ? 2 : 1),
                this.board.tileWidth * (isHorizontal ? 1 : 2));
        }

        var boardW = this.board.tileWidth * this.board.boardWidth * window.devicePixelRatio;
        var boardH = this.board.tileWidth * this.board.boardHeight * window.devicePixelRatio;

        var rectLeft = new Phaser.Rectangle(0, 0, mainRect.x, boardH);
        var rectRight = new Phaser.Rectangle(mainRect.x + mainRect.width, 0, boardW, boardH);
        var rectTop = new Phaser.Rectangle(mainRect.x, 0, mainRect.x + mainRect.width, mainRect.y);
        var rectBottom = new Phaser.Rectangle(mainRect.x, mainRect.y + mainRect.height, mainRect.x + mainRect.width, boardH);

        var maskRects = [rectLeft, rectRight, rectTop, rectBottom];

        this.showHighlightBox(mainRect, isHorizontal);

        this.mask = this.game.add.graphics(0, 0);

        //  Shapes drawn to the Graphics object must be filled.
        this.mask.beginFill(0xffffff);

        for (var i = 0; i < maskRects.length; i++) {

            this.mask.drawRect(
                maskRects[i].x,
                maskRects[i].y,
                maskRects[i].width,
                maskRects[i].height);
        }

        this.mask.isMask = true;

        return this.mask;
    }

    createHighlightBox() {

        var xOffset = this.board.tileWidth * 0.08;
        var yOffset = this.board.tileWidth * 0.04;

        this.highlightBox = this.game.add.sprite(0, 0, 'sprites', 'highlight-box-2.png');

        this.highlightBox.scale.x = (this.board.tileWidth + (xOffset * 2)) / this.highlightBox._frame.width;
        this.highlightBox.scale.y = (this.board.tileWidth + (xOffset * 2)) / this.highlightBox._frame.width;

        this.highlightBox.alpha = 0;
    }

    showHighlightBox(rect, isHorizontal) {

        this.highlightBox.alpha = 1;

        var xOffset = this.board.tileWidth * 0.08;
        var yOffset = this.board.tileWidth * 0.04;

        var x = rect.x - xOffset;
        var y = rect.y - yOffset;

        this.highlightBox.angle = isHorizontal ? 90 : 0;

        this.highlightBox.x = x + (isHorizontal ? (this.board.tileWidth * 2) + (xOffset * 1.5) : 0);
        this.highlightBox.y = y + (isHorizontal ? -yOffset * 0.75 : 0);
    }

    createTutorialHand() {

        this.hand = this.game.add.sprite(0, 0, 'sprites', 'hand.png');

        this.hand.scale.x = (this.board.tileWidth * 2) / this.hand._frame.width;
        this.hand.scale.y = (this.board.tileWidth * 2) / this.hand._frame.width;

        this.hand.alpha = 0;

        this.hand.anchor.set(Settings.handAnchorX || 0, Settings.handAnchorY || 0);
    }

    animateTutorialHand(interaction) {

        if (Settings.interactionType === 'tap') {

            this.animateTutorialHandTap(interaction);
        }

        if (Settings.interactionType === 'swipe') {
            this.animateTutorialHandSwipe(interaction);
        }
    }

    animateTutorialHandSwipe(interaction) {

        this.hand.alpha = 1;

        this.hand.moveStart = {
            x: this.board.x + (interaction.highlightTiles[0].x * this.board.tileWidth) + (this.board.tileWidth * 0.5),
            y: this.board.y + (interaction.highlightTiles[0].y * this.board.tileWidth) + (this.board.tileWidth * 0.5)
        };

        this.hand.moveEnd = {
            x: this.board.x + (interaction.highlightTiles[1].x * this.board.tileWidth) + (this.board.tileWidth * 0.5),
            y: this.board.y + (interaction.highlightTiles[1].y * this.board.tileWidth) + (this.board.tileWidth * 0.5)
        };

        this.tweenHandSwipe(
            0,
            this.hand.moveStart.x,
            this.hand.moveStart.y,
            this.hand.moveEnd.x,
            this.hand.moveEnd.y);
    }

    animateTutorialHandTap(interaction) {

        this.hand.alpha = 0;

        this.hand.x = this.board.x + (interaction.highlightTiles[0].x * this.board.tileWidth) + (this.board.tileWidth * 0.5);
        this.hand.y = this.board.y + (interaction.highlightTiles[0].y * this.board.tileWidth) + (this.board.tileWidth * 0.5);

        this.tweenHandTap();
    }

    tweenHandTap(count) {

        count = count || 0;

        if (count > 2 || !this.hand || !this.hand.parent || this.hidden === true) {
            return;
        }

        var alpha = 1;

        var origScale = this.hand.scale.x;

        var scalar = 1.5;

        this.hand.scale.x = origScale * scalar;
        this.hand.scale.y = origScale * scalar;

        var effectDuration = 1000;

        var transitionDuration = effectDuration * 0.3;

        var transitionRemaining = effectDuration - (2 * transitionDuration);

        var fadeTime = (transitionDuration * 2) + transitionRemaining;

        var tween1 = this.game.add.tween(this.hand).to({ alpha: 1 }, transitionDuration, Phaser.Easing.Linear.None, true);
        var tween2 = this.game.add.tween(this.hand).to({ alpha: 0 }, transitionDuration, Phaser.Easing.Linear.None, false, transitionRemaining);
        var tween3 = this.game.add.tween(this.hand.scale).to({ x: origScale, y: origScale }, effectDuration, Phaser.Easing.Linear.None, true);

        tween1.chain(tween2);

        tween2.onComplete.add(function() {
            // callback complete anom function

            this.game.time.events.add(500, function() {

                this.tweenHandTap(count + 1);
            }, this);
        }, this);
    }

    tweenHandSwipe(count, x1, y1, x2, y2) {

        count = count || 0;

        if (count > 2 || !this.hand || !this.hand.parent || this.hidden === true) {
            return;
        }

        var alpha = 1;

        this.hand.x = x1;
        this.hand.y = y1;

        this.hand.alpha = 0;

        var tween1 = this.game.add.tween(this.hand).to({ alpha: alpha }, 300, Phaser.Easing.Linear.None, true);
        var tween2 = this.game.add.tween(this.hand).to({ x: x2, y: y2 }, 300, Phaser.Easing.Linear.None);
        var tween3 = this.game.add.tween(this.hand).to({ alpha: 0 }, 300, Phaser.Easing.Linear.None);

        tween1.chain(tween2);
        tween2.chain(tween3);

        tween3.onComplete.add(function() {
            // callback complete anom function

            this.game.time.events.add(500, function() {

                this.tweenHandSwipe(count + 1, x1, y1, x2, y2);
            }, this);
        }, this);
    }

    createTooltip() {

        this.tooltipGrp = this.game.add.group();

        this.tooltip = this.createItem('sprites', 'tooltip', 'tooltip');
        this.tooltipText = this.createText();

        this.tooltipGrp.add(this.tooltip);
        this.tooltipGrp.add(this.tooltipText);

        this.tooltipGrp.alpha = 0;
    }

    createItem(key, name, el) {

        var sprite = new Phaser.Sprite(this.game, 0, 0, key, name + '.png');

        sprite.anchor.set(0.5, 0.5);

        Util.spriteToDom(el, sprite);

        return sprite;
    }

    createText() {

        var txt = new Phaser.Text(this.game, 0, 0, '', {
            font: '200px mainfont',
            fill: Settings.tooltipTextFill,
            stroke: Settings.tooltipTextStroke,
            strokeThickness: Settings.tooltipTextStrokeThickness,
            align: 'center'
        });

        txt.anchor.set(0.5, 0.5);

        return txt;
    }

    setTooltipText(txt) {

        this.tooltipText.setText(txt);

        Util.textToDom('tooltip-text', this.tooltipText);
    }

    showTooltip() {

        var duration = 500;

        Util.fade(this.tooltipGrp, 1, duration);

        this.game.add.tween(this.tooltipGrp).from({ y: -100 }, duration, Phaser.Easing.Linear.None, true);
    }

    createArrow() {

        this.arrow = this.game.add.sprite(0, 0, 'sprites', 'arrow.png');

        this.arrow.scale.x = (this.board.tileWidth * 2) / this.arrow._frame.width;
        this.arrow.scale.y = (this.board.tileWidth * 2) / this.arrow._frame.width;

        this.arrow.anchor.set(1, 0.5);

        this.arrow.alpha = 0;
    }

    showArrow(interaction) {

        this.arrow.x = this.board.x + (interaction.highlightTiles[0].x * this.board.tileWidth) - (this.board.tileWidth * 0.1);
        this.arrow.y = this.board.y + (interaction.highlightTiles[0].y * this.board.tileWidth) + (this.board.tileWidth * 0.5);

        var tweenHoriz = interaction.arrow.dir === 'left' || interaction.arrow.dir === 'right';

        if (interaction.arrow.dir === 'right') {

            this.arrow.scale.x = Math.abs(this.arrow.scale.x) * -1;

            this.arrow.x += this.board.tileWidth * 1.5;
        }

        if (interaction.arrow.dir === 'up') {

            this.arrow.angle = -90;

            this.arrow.x = this.board.x + (interaction.highlightTiles[0].x * this.board.tileWidth) - (this.board.tileWidth * -0.5);
            this.arrow.y = this.board.y + (interaction.highlightTiles[0].y * this.board.tileWidth) + (this.board.tileWidth * 1.3);
        }

        if (interaction.arrow.dir === 'down') {

            this.arrow.angle = 90;

            this.arrow.x = this.board.x + (interaction.highlightTiles[0].x * this.board.tileWidth) - (this.board.tileWidth * -0.5);
            this.arrow.y = this.board.y + (interaction.highlightTiles[0].y * this.board.tileWidth) + (this.board.tileWidth * 0);
        }

        var duration = 500;

        Util.fade(this.arrow, 1, duration);

        if (tweenHoriz) {

            this.game.add.tween(this.arrow).to({ x: this.arrow.x - (this.board.tileWidth * 0.25) }, 500, Phaser.Easing.Linear.None, true, 0, 0, true).loop();
        } else {

            this.game.add.tween(this.arrow).to({ y: this.arrow.y - (this.board.tileWidth * 0.25) }, 500, Phaser.Easing.Linear.None, true, 0, 0, true).loop();
        }
    }
}

export default Instructions;