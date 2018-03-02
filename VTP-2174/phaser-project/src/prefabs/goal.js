import Settings from '../../settings';
import * as Tweener from '../utils/tweener';
import * as Util from '../utils/util';

class Goal extends Phaser.Group {

    //initialization code in the constructor
    constructor(game) {

        super(game);

        this.createItem({
            key: 'sprites',
            name: 'goal-panel'
        }, 'goal-panel');

        if (Settings.goal1) {
            this.createItem(Settings.goal1, 'goal-item-1');
            this.createText(Settings.goal1, 'goal-text-1');
        }

        if (Settings.goal2) {
            this.createItem(Settings.goal2, 'goal-item-2');
            this.createText(Settings.goal2, 'goal-text-2');
        }

        if (Settings.goal3) {
            this.createItem(Settings.goal3, 'goal-item-3');
            this.createText(Settings.goal3, 'goal-text-3');
        }

        this.game.add.existing(this);

        this.game.onGetGoalItem.add(this.onGetGoalItem, this);
        this.game.onGameComplete.add(this.onGameComplete, this);
    }

    createItem(goal, el) {

        var key = goal.key || 'pieces';
        var name = goal.name || goal.item;

        var sprite = new Phaser.Sprite(this.game, 0, 0, key, name + '.png');

        sprite.anchor.set(0.5, 0.5);

        sprite.angle = goal.angle || 0;

        if (Util.isPortrait() === true && key === 'goal-panel') {
            sprite.angle = Settings.goalPanelAnglePortrait || 0;
        } else {
            sprite.angle = Settings.goalPanelAngleLandscape || 0;
        }

        if (goal.name !== 'goal-panel') {

            sprite.angle += this['goal-panel'].angle * -1;
        }

        Util.spriteToDom(el, sprite);

        this[el] = sprite;

        this.add(sprite);
    }

    createText(goal, el) {

        var txt = new Phaser.Text(this.game, 0, 0, goal.amount, {
            font: '100px mainfont',
            fill: Settings.goalTextFill,
            stroke: Settings.goalTextStroke,
            strokeThickness: Settings.goalTextStrokeThickness,
            align: 'center'
        });

        txt.anchor.set(0.5, 0.5);

        txt.angle = goal.angle || 0;

        this[el] = txt;

        this[el].origScale = this[el].scale.x;

        Util.textToDom(el, txt);

        this.add(txt);
    }

    onGetGoalItem(info) {

        var key = info.replace('item', 'text');

        var txt = this[key];

        var amount = parseInt(txt.text);

        amount--;

        if (amount <= 0) {

            if (this.game.cache.getFrameByName('sprites', 'goal-completed.png') !== null) {

                var sprite = new Phaser.Sprite(this.game, 0, 0, 'sprites', 'goal-completed.png');

                sprite.anchor.set(0.5, 0.5);

                Util.spriteToDom('complete-' + key, sprite);

                this['complete-' + key] = sprite;

                this.add(sprite);

                sprite.alpha = 0;

                Tweener.fade(sprite, 1, 0, 250);
                Tweener.fade(txt, 0, 0, 250);

                var origScale = sprite.scale.x;

                sprite.scale.x = 0;
                sprite.scale.y = 0;

                this.game.add.tween(sprite.scale).to({
                        x: origScale,
                        y: origScale
                    },
                    600,
                    Phaser.Easing.Back.Out,
                    true,
                    0);
            }
        }

        txt.setText(amount);

        txt.scale.x = txt.origScale * 2;
        txt.scale.y = txt.origScale * 2;

        this.game.add.tween(txt.scale).to({
                x: txt.origScale,
                y: txt.origScale
            },
            600,
            Phaser.Easing.Back.Out,
            true,
            0);
    }

    onGameComplete() {

        if (Settings.removeGoalPanelOnComplete === true) {

            var x = 0;
            var y = 0;

            var exitDir = 'up';

            if (Util.isPortrait() === true) {

                exitDir = Settings.goalPanelExitPortrait || 'up';

            } else {

                exitDir = Settings.goalPanelExitPortrait || 'up';
            }

            switch (exitDir) {
                case 'up':
                    y = -1 * (this['goal-panel'].y + (this['goal-panel'].height * 0.5));
                    break;
                case 'down':
                    y = (this.game.world.height - this['goal-panel'].y) + (this['goal-panel'].height * 0.5);
                    break;
                case 'left':
                    x = -1 * (this['goal-panel'].x + (this['goal-panel'].width * 0.5));
                    break;
                case 'right':
                    x = (this.game.world.width - this['goal-panel'].x) + (this['goal-panel'].width * 0.5);
                    break;
            }

            var tween = this.game.add.tween(this).to({
                    x: x,
                    y: y
                },
                Settings.goalExitDuration,
                Phaser.Easing.Back.In,
                true,
                Settings.goalExitDelay);
        }
    }
}

export default Goal;