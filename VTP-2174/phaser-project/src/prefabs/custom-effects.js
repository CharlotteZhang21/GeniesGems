import * as Tweener from '../utils/tweener';
import * as Util from '../utils/util';
import Settings from '../../settings';

class CustomEffects {

    //initialization code in the constructor
    constructor(game) {

        this.game = game;

        this.customEffects = [];

        this.aboveGrp = this.game.add.group();
        this.belowGrp = this.game.add.group();

        this.sortLayers();

        this.processEffects('begin');

        this.game.onInteract.add(this.onInteract, this);
        this.game.onInteractionComplete.add(this.onInteractionComplete, this);
        this.game.onGameComplete.add(this.onGameComplete, this);
        this.game.onFinalScene.add(this.onFinalScene, this);
    }

    sortLayers() {

        this.game.world.bringToTop(this.aboveGrp);
        this.game.world.sendToBack(this.belowGrp);
    }

    onInteract() {

        this.sortLayers();

        this.processEffects('interaction' + this.game.global.interaction + '-start');
    }

    onInteractionComplete() {

        this.sortLayers();

        this.processEffects('interaction' + (this.game.global.interaction - 1) + '-end');
    }

    onGameComplete() {

        this.sortLayers();

        this.processEffects('win');
    }

    onFinalScene() {

        this.sortLayers();

        this.processEffects('finalScene');
    }

    processEffects(type) {

        this.effects = this.getEffects(type);

        var delay, duration;

        this.customEffects.forEach(function(ce, index) {

            delay = Array.isArray(ce.hideDelay) === true ? ce.hideDelay[index] : ce.hideDelay || 0;
            duration = Array.isArray(ce.hideDuration) === true ? ce.hideDuration[index] : ce.hideDuration || 0;

            Tweener.fadeOut(
                ce.sprite,
                delay,
                duration,
                Phaser.Easing.Linear.None,
                true);

        }, this);

        this.effects.forEach(function(e) {

            this.processEffect(e);

        }, this);
    }

    processEffect(effect) {

        var isAnimation = this.game.cache.checkImageKey(effect.key);

        var delay = effect.delay || 0;

        var hideDelay;

        if (Array.isArray(effect.delay)) {

            delay = effect.delay[effect.index];
        }

        this.game.time.events.add(delay, function() {

            if (isAnimation === true) {

                this.createAnimation(effect);
            } else {
                this.createItem(effect);
            }

            this.doAnimation(effect);

        }, this);
    }

    createItem(effect) {

        var sprite = new Phaser.Sprite(this.game, 0, 0, 'sprites', effect.key + '.png');

        Util.spriteToDom(effect.htmlId, sprite);

        sprite.anchor.set(
            typeof effect.anchorX !== 'undefined' ? effect.anchorX : 0.5,
            typeof effect.anchorY !== 'undefined' ? effect.anchorY : 0.5);

        effect.sprite = sprite;

        if (effect.below === true) {
            this.belowGrp.add(sprite);
        } else {
            this.aboveGrp.add(sprite);
        }

        this.customEffects.push(effect);
    }

    createAnimation(effect) {

        var sprite = new Phaser.Sprite(this.game, 0, 0, effect.key);

        Util.animToDom(effect.htmlId, sprite);

        sprite.anchor.set(
            typeof effect.anchorX !== 'undefined' ? effect.anchorX : 0.5,
            typeof effect.anchorY !== 'undefined' ? effect.anchorY : 0.5);

        var anim = sprite.animations.add('anim');

        sprite.animations.play('anim', effect.fps, effect.loop, true);

        effect.sprite = sprite;

        if (effect.below === true) {
            this.belowGrp.add(sprite);
        } else {
            this.aboveGrp.add(sprite);
        }

        if (effect.randomPosition === true) {

            sprite.x = Util.rndInt(this.game.world.width, 0);
            sprite.y = Util.rndInt(this.game.world.height, 0);

            if (effect.randomAngle === true) {
                sprite.angle = Util.rndInt(360, 0);
            }

            if (effect.loop === true) {

                anim.onLoop.add(function(item) {

                    item.x = Util.rndInt(this.game.world.width, 0);
                    item.y = Util.rndInt(this.game.world.height, 0);

                    if (effect.randomAngle === true) {
                        item.angle = Util.rndInt(360, 0);
                    }

                }, this);
            }
        }

        this.customEffects.push(effect);
    }

    doAnimation(effect) {

        var tweens = [];

        var alpha, delay, duration, easing, x, y, angle, elId, toScale, endScale, xScale, yScale;

        (effect.animations || []).forEach(function(a) {

            if (a.animation === 'fadeIn') {
                effect.sprite.alpha = 0;
            }

            // defaults
            delay = a.delay || 0;
            duration = a.duration || 0;
            easing = Util.getEasing(a.easing || 'Linear');
            x = typeof a.x !== 'undefined' ? Util.toPerc(a.x) : 0;
            y = typeof a.y !== 'undefined' ? Util.toPerc(a.y) : 0;
            angle = a.angle || 0;
            toScale = a.toScale || 1;
            endScale = a.endScale || 1;
            elId = a.htmlId || '';
            xScale = a.xScale || 1;
            yScale = a.yScale || 1;

            switch (a.animation) {
                case 'moveTo':

                    x = effect.sprite.x + (effect.sprite.width * x);
                    y = effect.sprite.y + (effect.sprite.height * y);

                    Tweener.moveTo(
                        effect.sprite, x, y, delay, duration, easing);
                    break;
                case 'fade':
                    Tweener.fade(effect.sprite, alpha, delay, duration, easing);
                    break;
                case 'fadeIn':
                    Tweener.fadeIn(effect.sprite, delay, duration, easing);
                    break;
                case 'fadeOut':
                    Tweener.fadeOut(effect.sprite, delay, duration, easing);
                    break;
                case 'scaleTo':
                    Tweener.scaleTo(effect.sprite, x, y, delay, duration, easing);
                    break;
                case 'scaleIn':
                    Tweener.scaleIn(effect.sprite, delay, duration, easing);
                    break;
                case 'moveToDom':
                    Tweener.moveToDom(effect.sprite, elId, delay, duration, easing);
                    break;
                case 'bulge':
                    Tweener.bulge(effect.sprite, delay, duration);
                    break;
                case 'spinIn':
                    Tweener.spinIn(effect.sprite, delay, duration);
                    break;
                case 'wobbleScaleIn':
                    Tweener.wobbleScaleIn(effect.sprite, angle, toScale, endScale);
                    break;
                case 'jiggle':
                    Tweener.jiggle(effect.sprite, xScale, yScale, duration);
                    break;
                case 'jiggleAngle':
                    Tweener.jiggleAngle(effect.sprite, angle, duration);
                    break;
                case 'scaleThenFade':
                    Tweener.scaleThenFade(effect.sprite, delay, duration);
                    break;
            }
        }, this);
    }

    convertPercentToTweenPixels(percent, sprite, isVertical) {

        percent = percent || '0%';

        var p = Number(percent.replace('%', '')) * 0.01;

        var sign = p < 0 ? '-' : '+';

        p = Math.abs(p);

        var value = isVertical ? sprite.height * p : sprite.width * p;

        value = sign + value;

        return value;
    }

    getEffects(type) {

        var effects = [];

        var effect;

        for (var key in Settings.customEffects) {

            if (Settings.customEffects.hasOwnProperty(key) && Settings.customEffects[key].showOn === type) {

                effect = Util.clone(Settings.customEffects[key]);

                effect.key = key;

                if (Array.isArray(effect.htmlId) === true) {

                    effect.htmlId.forEach(function(el, index) {

                        effect = Util.clone(effect);

                        effect.htmlId = el;

                        effect.index = index;

                        effects.push(effect);

                    }, this);

                } else {

                    effects.push(effect);
                }

            }
        }

        return effects;
    }
}

export default CustomEffects;