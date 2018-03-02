/* list of common tween effects */

export function moveTo(sprite, x, y, delay, duration, easing, cb, autoStart) {

    if (sprite === null || sprite.game === null) {
        return null;
    }

    var tween = sprite.game.add.tween(sprite).to({
            x: x,
            y: y
        },
        duration,
        easing,
        typeof autoStart === 'undefined' ? true : autoStart,
        delay);

    if (cb) {
        tween.onComplete.add(cb, this);
    }

    return tween;
}

export function fade(sprite, alpha, delay, duration, easing, autoStart, cb) {

    if (sprite === null || sprite.game === null) {
        return null;
    }

    var to = {};

    if (alpha !== null) {

        to = {
            alpha: alpha
        };
    }

    var tween = sprite.game.add.tween(sprite).to(to,
        duration === 0 ? 1 : duration, // duration of 0 resets to 1000, force a small value
        easing,
        typeof autoStart === 'undefined' ? true : autoStart,
        delay);

    if (cb) {
        tween.onComplete.add(cb, this);
    }

    return tween;
}

export function fadeIn(sprite, delay, duration, easing, autoStart, cb) {

    return this.fade(sprite, 1, delay, duration, easing, autoStart, cb);
}

export function fadeOut(sprite, delay, duration, easing, autoStart, cb) {

    return this.fade(sprite, 0, delay, duration, easing, autoStart, cb);
}

export function scaleTo(sprite, x, y, delay, duration, easing, cb) {

    if (sprite === null || sprite.game === null) {
        return null;
    }

    var tween = sprite.game.add.tween(sprite.scale).to({
            x: x,
            y: y
        },
        duration,
        easing,
        true,
        delay);

    if (cb) {
        tween.onComplete.add(cb, this);
    }

    return tween;
}

export function moveToDom(sprite, elId, delay, duration, easing, cb) {

    if (sprite === null || sprite.game === null) {
        return null;
    }

    var el = document.getElementById(elId);

    var rect = el.getBoundingClientRect();

    var scale = this.getScaleFromDom(elId, sprite);

    this.moveTo(
        sprite,
        (rect.left + (rect.width * 0.5)) * window.devicePixelRatio,
        (rect.top + (rect.height * 0.5)) * window.devicePixelRatio,
        delay,
        duration,
        easing,
        cb);

    this.scaleTo(
        sprite,
        scale,
        scale,
        delay,
        duration,
        easing);
}

export function getScaleFromDom(elId, sprite) {

    var el = document.getElementById(elId);

    var rect = el.getBoundingClientRect();

    // first try to fit horizontally

    var scale = (rect.width * window.devicePixelRatio) / sprite._frame.width;

    //check if fits
    var fitsHorizontally = sprite._frame.height * scale <= (rect.height * window.devicePixelRatio);

    if (fitsHorizontally === false) {

        //sprite would be too tall if fitted horizontally, try vertical

        scale = (rect.height * window.devicePixelRatio) / sprite._frame.height;
    }

    return scale;
}

export function bulge(sprite, delay, duration) {

    if (sprite === null || sprite.game === null) {
        return null;
    }

    sprite.game.add.tween(sprite.scale).to({
            x: sprite.scale.x * 1.2,
            y: sprite.scale.x * 1.2
        },
        duration,
        Phaser.Easing.Quadratic.InOut,
        true, delay, -1, true);
}

export function spinIn(sprite, delay, duration) {

    if (sprite === null || sprite.game === null) {
        return null;
    }

    var scaleX = sprite.scale.x;
    var scaleY = sprite.scale.y;

    sprite.angle = 0;

    sprite.scale.x = 0;
    sprite.scale.y = 0;

    sprite.game.add.tween(sprite.scale).to({
            x: scaleX,
            y: scaleY
        },
        duration,
        Phaser.Easing.Quadratic.InOut, true, delay);

    sprite.game.add.tween(sprite).to({
            angle: 360
        },
        duration,
        Phaser.Easing.Back.InOut, true, delay);
}

export function wobbleScaleIn(sprite, angle, toScale, endScale, cb) {

    if (sprite === null || sprite.game === null) {
        return null;
    }

    var duration = 500;

    toScale = sprite.scale.x * toScale;

    endScale = sprite.scale.x * endScale;

    var t1 = sprite.game.add.tween(sprite.scale).to({
            x: toScale,
            y: toScale
        },
        duration,
        Phaser.Easing.Quadratic.Out,
        true,
        0);

    var t2 = sprite.game.add.tween(sprite.scale).to({
            x: endScale,
            y: endScale
        }, duration,
        Phaser.Easing.Quadratic.In,
        false,
        0);

    t1.chain(t2);

    var tween = sprite.game.add.tween(sprite).to({
            angle: 15
        }, duration,
        function(k) {
            return Math.sin(Math.PI * 2 * k);
        }, true, 0, 1);

    if (cb) {
        tween.onComplete.add(function() {
            cb(sprite);
        }, this);
    }
}

export function jiggle(sprite, xScalar, yScalar, duration) {


    var origScaleX = sprite.scale.x;
    var origScaleY = sprite.scale.y;

    sprite.game.add.tween(sprite.scale).to({
            x: origScaleX * (xScalar || 1.1),
            y: origScaleY * (yScalar || 0.9)
        },
        duration || 800,
        Phaser.Easing.Linear.None,
        true,
        0, -1).yoyo(true, 0);
}

export function jiggleAngle(sprite, angle, duration) {

    angle = angle || 10;

    var origAngle = sprite.angle;

    var newAngle = origAngle + angle;

    sprite.angle -= angle;

    sprite.game.add.tween(sprite).to({
            angle: newAngle
        },
        800,
        Phaser.Easing.Linear.None,
        true,
        0, -1).yoyo(true, 0);
}



export function scaleIn(sprite, delay, duration, easing) {

    var scaleX = sprite.scale.x;
    var scaleY = sprite.scale.y;

    sprite.scale.x = 0;
    sprite.scale.y = 0;

    sprite.game.add.tween(sprite.scale).to({
            x: scaleX,
            y: scaleY
        },
        duration || 800,
        Phaser.Easing.Elastic.Out, true, delay || 0);
}


export function fadeFloat(sprite, distance, delay, duration) {

    var fadeDuration = duration * 0.30;

    sprite.alpha = 0;

    var t1 = sprite.game.add.tween(sprite).to({ alpha: 1 }, fadeDuration, Phaser.Easing.Linear.None, true, delay || 0);
    var t2 = sprite.game.add.tween(sprite).to({ alpha: 0 }, fadeDuration, Phaser.Easing.Linear.None, false, duration - (2 *fadeDuration));

    t1.chain(t2);

    sprite.game.add.tween(sprite).to({ y: '-' + distance }, duration, Phaser.Easing.Quadratic.Out, true, delay || 0);
}

export function scaleThenFade(sprite, delay, duration) {

    var fadeDuration = duration * 0.30;
    var scaleDuration = duration * 0.15;

    var scaleX = sprite.scale.x;
    var scaleY = sprite.scale.y;

    sprite.scale.x = 0;
    sprite.scale.y = 0;

    sprite.game.add.tween(sprite.scale).to({
            x: scaleX,
            y: scaleY
        },
        scaleDuration,
        Phaser.Easing.Quadratic.In, true, delay || 0);


    sprite.game.add.tween(sprite).to({ alpha: 0 }, fadeDuration, Phaser.Easing.Linear.None, true, duration - scaleDuration);

}

// tween.onComplete.add(function() {

//        var tween2 = this.game.add.tween(friendClone).to({ x: this.topBar.getItem3XCoord(), y: this.topBar.getItem3YCoord() },
//            endDuration, Phaser.Easing.Linear.None, true, 50);
//        tween2.onComplete.add(function() {
//            this.topBar.decreaseItem3Counter();
//            friendClone.destroy();
//        }, this);

//        // var tween3 = this.game.add.tween(friendClone.scale).to({ x: this.topBar.getItemScale(), y: this.topBar.getItemScale() },
//        //     500, Phaser.Easing.Linear.None, true, 0);

//    }, this);