import * as Blast from '../utils/blast';
import * as Tweener from '../utils/tweener';
import * as Util from '../utils/util';
import BoardData from '../board/board';
import Boosters from '../const/boosters';
import Fox from '../prefabs/fox.js'
import CustomBounce from '../utils/custom-bounce';
import FallPieces from '../board/fall-pieces';
import Settings from '../../settings';

class Board {

    //initialization code in the constructor
    constructor(game) {

        this.game = game;

        this.el = document.getElementById('board-inner');
        this.elRect = this.el.getBoundingClientRect();

        this.boardData = BoardData;
        this.fallPieces = FallPieces;

        this.boardWidth = this.boardData.layers[0].width;
        this.boardHeight = this.boardData.layers[0].height;

        this.tileWidth = this.elRect.width * window.devicePixelRatio / this.boardWidth;

        this.numberOfTiles = this.boardWidth * this.boardHeight;

        this.initTileIds();
        this.initFallPieces();
        this.initGoals();
        this.initBoosters();
        this.createGrid();

        this.swipeDuration = 150;
        this.comboDuration = 150;
        this.staggerDelay = 80;
        this.flySpeed = 200;

        this.game.onInteract.add(this.onInteract, this);
        this.game.onGameComplete.add(this.onGameComplete, this);
    }

    initBoosters() {

        this.boosters = [];

        var booster;

        for (var key in Settings) {

            if (Settings.hasOwnProperty(key) && key.indexOf('booster') === 0) {

                booster = Settings[key];


                booster.toGenerate = Settings.interactionType === 'tap' ? booster.piecesToCreate : Boosters[Settings.interactionType][booster.piecesToCreate];

                booster.key = key;

                if (!booster.toGenerate) {
                    console.error('Unknown piecesToCreate setting "' + booster.piecesToCreate + '"');
                }

                this.boosters.push(booster);
            }
        }
    }

    initGoals() {

        this.goals = {};

        var booster;

        for (var key in Settings) {

            if (Settings.hasOwnProperty(key) && key.indexOf('goal') === 0) {

                this.goals[Settings[key].item] = key.replace('goal', 'goal-item-');

                if (Settings[key].matchesTo !== undefined) {

                    for (var i = 0; i < Settings[key].matchesTo.length; i++) {

                        this.goals[Settings[key].matchesTo[i]] = key.replace('goal', 'goal-item-');
                    }
                }
            }
        }
    }

    initFallPieces() {

        var tiles = this.fallPieces.layers['0'].data;

        this.fallPieces = {};

        var x = 0;

        for (var i = 0; i < tiles.length; i++) {

            this.fallPieces[x] = this.fallPieces[x] || [];

            this.fallPieces[x].unshift(this.tileIds[tiles[i]]);

            x++;

            if (x >= this.boardWidth) {
                x = 0;
            }
        }
    }

    getBooster(origTile, matches) {

        var matchComps = this.getMatchComponents(origTile, matches);

        var piecesToCreate;

        for (var i = 0; i < this.boosters.length; i++) {

            for (var j = 0; j < this.boosters[i].toGenerate.length; j++) {

                if (Settings.interactionType === 'swipe' &&
                    matchComps.h === this.boosters[i].toGenerate[j].h &&
                    matchComps.v === this.boosters[i].toGenerate[j].v) {

                    return this.boosters[i];
                }

                if (Settings.interactionType === 'tap') {

                    for (var k = 0; k < this.boosters[i].piecesToCreate.length; k++) {

                        if (matches.length === this.boosters[i].piecesToCreate[k]) {

                            return this.boosters[i];
                        }
                    }
                }
            }
        }

        return null;
    }

    getMatchComponents(origTile, matches) {

        var vertical = 0;
        var horizontal = 0;

        matches.forEach(function(m) {

            horizontal += origTile.settings.y === m.settings.y ? 1 : 0;
            vertical += origTile.settings.x === m.settings.x ? 1 : 0;

        }, this);

        return {
            v: vertical,
            h: horizontal
        };
    }

    createGrid() {

        this.createLayers();

        this.tiles = [];
        this.belowTiles = [];
        this.bottomTiles = [];
        this.boardLayout = [];

        this.highPoints = {};
        this.lowPoints = {};

        var x = 0;
        var y = 0;

        var collectable;

        // console.log(this.tileIds);

        for (var i = 0; i < this.numberOfTiles; i++) {

            if (this.aboveLayer[i] !== 0) {

                this.highPoints[x] = Math.min(typeof this.highPoints[x] === 'undefined' ? y : this.highPoints[x], y);
                this.lowPoints[x] = Math.max(typeof this.lowPoints[x] === 'undefined' ? y : this.highPoints[x], y);

                this.aboveLayerGrp.add(this.createTile(this.tileIds[this.aboveLayer[i]], x, y, Settings.piecePadding, this.tiles));

                this.boardLayout.push({
                    x: x,
                    y: y
                });
            }

            if (this.belowLayer[i] !== 0) {

                this.belowLayerGrp.add(this.createTile(this.tileIds[this.belowLayer[i]], x, y, Settings.belowPiecePadding, this.belowTiles));
            }

            if (this.bottomLayer[i] !== 0) {

                collectable = this.createTile(this.tileIds[this.bottomLayer[i]], x, y, Settings.belowPiecePadding, this.bottomTiles);

                collectable.anchor.set(0.5, 0.75);

                this.bottomLayerGrp.add(collectable);
            }

            x++;

            if (x >= this.boardWidth) {
                x = 0;
                y++;
            }
        }

        this.bgLayerGrp.add(this.createItem('sprites', 'board', 'board'));

        this.createOverlay();

        this.createFox();

        if (Settings.interactionType === 'tap') {

            this.toggleTapBoosterIndicators();
        }
    }

    createFox() {
        var fox = new Fox(this.game, this);
        this.fox = fox;
    }

    createOverlay() {

        if (this.overlay) {
            this.overlay.destroy();
        }

        this.overlay = this.createItem('sprites', 'board-mask', 'board-mask');
        this.overlay.alpha = 0;
        this.overlayLayerGrp.add(this.overlay);
    }

    initTileIds() {

        this.tileIds = {};

        var tileset = this.boardData.tilesets[0];

        for (var key in tileset.tiles) {
            if (tileset.tiles.hasOwnProperty(key)) {

                this.tileIds[parseInt(key) + 1] = tileset.tiles[key].image
                    .replace('../../pieces/', '')
                    .replace('.png', '');
            }
        }
    }

    createLayers() {

        this.bgLayerGrp = this.game.add.group();
        this.bottomLayerGrp = this.game.add.group();
        this.belowLayerGrp = this.game.add.group();
        this.aboveLayerGrp = this.game.add.group();
        this.overlayLayerGrp = this.game.add.group();

        var tileset = this.boardData.tilesets[0];

        for (var key in this.boardData.layers) {
            if (this.boardData.layers.hasOwnProperty(key)) {

                if (this.boardData.layers[key].name === 'pieces') {

                    // console.log(key);
                    // console.log("----");
                    // console.log(this.boardData.layers[key].data)

                    this.aboveLayer = this.boardData.layers[key].data;
                }

                if (this.boardData.layers[key].name === 'under') {

                    this.belowLayer = this.boardData.layers[key].data;
                }

                if (this.boardData.layers[key].name === 'bottom') {

                    this.bottomLayer = this.boardData.layers[key].data;
                }
            }
        }

        this.aboveLayerGrp.x = this.elRect.left * window.devicePixelRatio;
        this.aboveLayerGrp.y = this.elRect.top * window.devicePixelRatio;

        this.belowLayerGrp.x = this.elRect.left * window.devicePixelRatio;
        this.belowLayerGrp.y = this.elRect.top * window.devicePixelRatio;

        this.bottomLayerGrp.x = this.elRect.left * window.devicePixelRatio;
        this.bottomLayerGrp.y = this.elRect.top * window.devicePixelRatio;

        this.x = this.aboveLayerGrp.x;
        this.y = this.aboveLayerGrp.y;
    }

    createTile(key, x, y, padding, arr) {

        // if(x == this.fox.x && y == this.fox.y) {
        //     return;
        // }

        // console.log(key);

        var sprite = this.genSpriteOrAnim('pieces', key, key + '-idle', x, y, padding);

        sprite.settings = {
            key: key,
            x: x,
            y: y,
        };

        if(key.indexOf('paw') !== -1){
            sprite.settings.matchesTo = sprite.settings.key.slice(0,7);
        }

        if (key.indexOf('booster') !== -1 && Settings[key]) {

            sprite.settings = Util.extend(sprite.settings, Settings[key]);
        }

        if (arr) {
            arr.push(sprite);
        }

        // debugging
        // sprite.inputEnabled = true;
        // sprite.events.onInputDown.add(function(a) {

        //     console.log(a.settings);

        //     // this.getMatches(a).forEach(function(t) {

        //     //     t.tint = 0x000000;
        //     // }, this);
        // }, this);

        return sprite;
    }

    createItem(key, name, el) {

        var sprite = new Phaser.Sprite(this.game, 0, 0, key, name + '.png');

        sprite.anchor.set(0.5, 0.5);

        Util.spriteToDom(el, sprite);

        return sprite;
    }

    showOverlay() {
        Util.fade(this.overlay, 1, 300);
    }

    hideOverlay() {
        Util.fade(this.overlay, 0, 300);
    }

    getTileAt(x, y, arr) {
        for (var i = 0; i < arr.length; i++) {

            if (arr[i].settings.x === x && arr[i].settings.y === y) {
                return arr[i];
            }
        }

        return null;
    }

    getMatches(tile, u, d, l, r, matches, restrict) {

        u = typeof u === 'undefined' ? true : u;
        d = typeof d === 'undefined' ? true : d;
        l = typeof l === 'undefined' ? true : l;
        r = typeof r === 'undefined' ? true : r;

        restrict = typeof restrict === 'undefined' ? true : restrict;

        matches = matches || [];

        matches.push(tile);

        var uTile = this.getTileAt(tile.settings.x + 0, tile.settings.y - 1, this.tiles);
        var dTile = this.getTileAt(tile.settings.x + 0, tile.settings.y + 1, this.tiles);
        var lTile = this.getTileAt(tile.settings.x - 1, tile.settings.y + 0, this.tiles);
        var rTile = this.getTileAt(tile.settings.x + 1, tile.settings.y + 0, this.tiles);

        if (tile.settings.key.indexOf("blocker") !== -1) {
            return matches;
        }

        if (u === true &&
            uTile !== null &&
            (uTile.settings.key === tile.settings.matchesTo || tile.settings.key === uTile.settings.matchesTo || uTile.settings.key === tile.settings.key) &&
            matches.indexOf(uTile) === -1) {

            if (restrict === true) {
                matches.concat(this.getMatches(uTile, true, false, false, false, matches, restrict));
            } else {
                matches.concat(this.getMatches(uTile, true, true, true, true, matches, restrict));
            }
        }

        if (d === true &&
            dTile !== null &&
            (dTile.settings.key === tile.settings.matchesTo || tile.settings.key === dTile.settings.matchesTo || dTile.settings.key === tile.settings.key) &&
            matches.indexOf(dTile) === -1) {

            if (restrict === true) {
                matches.concat(this.getMatches(dTile, false, true, false, false, matches, restrict));
            } else {
                matches.concat(this.getMatches(dTile, true, true, true, true, matches, restrict));
            }
        }

        if (l === true &&
            lTile !== null &&
            (lTile.settings.key === tile.settings.matchesTo || tile.settings.key === lTile.settings.matchesTo || lTile.settings.key === tile.settings.key) &&
            matches.indexOf(lTile) === -1) {


            if (restrict === true) {
                matches.concat(this.getMatches(lTile, false, false, true, false, matches, restrict));
            } else {
                matches.concat(this.getMatches(lTile, true, true, true, true, matches, restrict));
            }
        }

        if (r === true &&
            rTile !== null &&
            (rTile.settings.key === tile.settings.matchesTo || tile.settings.key === rTile.settings.matchesTo || rTile.settings.key === tile.settings.key) &&
            matches.indexOf(rTile) === -1) {

            if (restrict === true) {
                matches.concat(this.getMatches(rTile, false, false, false, true, matches, restrict));
            } else {
                matches.concat(this.getMatches(rTile, true, true, true, true, matches, restrict));
            }
        }
        return matches;
    }

    moveToLinear(tile, x, y, duration, cb) {

        this.moveTo(
            tile,
            (x * this.tileWidth) + (0.5 * this.tileWidth),
            (y * this.tileWidth) + (0.5 * this.tileWidth),
            duration,
            Phaser.Easing.Linear.None,
            function() {

                tile.settings.x = x;
                tile.settings.y = y;

                if (cb) {
                    cb(tile);
                }
            });
    }

    foxMoveToLinear(tile, x, y, duration, foxWin = false) {
        var finalY = (y * this.tileWidth) + (0.5 * this.tileWidth);
        this.moveTo(
            tile,
            (x * this.tileWidth) + (0.5 * this.tileWidth),
            [finalY*0.8, finalY],
            duration,
            Phaser.Easing.Linear.easeInOut,
            function() {

                tile.settings.x = x;
                tile.settings.y = y;

                if (foxWin) {

                    this.playAnimation(tile, 'fox-happy', true);

                    this.game.time.events.add(1800, function(){
                        tile.alpha = 1;
                        this.finishInteraction();
                    },this);
                }else{

                    tile.alpha = 1;
                    this.finishInteraction();
                }
                

                 
            });
    }

    moveTo(tile, x, y, duration, easing, cb) {

        var tween = this.game.add.tween(tile).to({
                x: x,
                y: y
            },
            duration,
            easing,
            true,
            0);

        if (cb) {
            tween.onComplete.add(cb, this);
        }
    }

    swipe(interaction) {

        var t1 = interaction.highlightTiles[0];
        var t2 = interaction.highlightTiles[1];

        var tile1 = this.getTileAt(t1.x, t1.y, this.tiles);
        var tile2 = this.getTileAt(t2.x, t2.y, this.tiles);

        this.moveToLinear(tile1, t2.x, t2.y, this.swipeDuration);
        this.moveToLinear(tile2, t1.x, t1.y, this.swipeDuration);

        this.game.time.events.add(this.swipeDuration + 50, function() {

            this.handleMatches([tile1, tile2]);

            if (interaction.floatText) {

                this.game.time.events.add(50, function() {

                    this.floatText(interaction.floatText);
                }, this);
            }

        }, this);
    }

    tap(interaction) {

        var t1 = interaction.highlightTiles[0];

        var tile1 = this.getTileAt(t1.x, t1.y, this.tiles);

        this.handleMatches([tile1]);

        if (interaction.floatText) {

            this.game.time.events.add(50, function() {

                this.floatText(interaction.floatText);

            }, this);
        }
    }

    removeTile(tile) {

        Util.remove(this.tiles, tile);
        Util.remove(this.belowTiles, tile);

        tile.destroy();
    }

    genSpriteOrAnim(key, name, animName, x, y, padding) {

        var isAnim = this.game.cache.checkImageKey(animName);

        var sprite, scale;

        if (isAnim === true) {

            sprite = new Phaser.Sprite(
                this.game,
                x * this.tileWidth,
                y * this.tileWidth,
                animName);

            scale = (this.tileWidth * (1 - Util.toPerc(padding))) / sprite._frame.width;

            sprite.animations.add('anim');

            // defaults
            var fps = 30;
            var loop = true;
            var scalar = 1;

            if (Settings.animations[animName]) {

                fps = typeof Settings.animations[animName].fps !== 'undefined' ? Settings.animations[animName].fps : 30;
                loop = typeof Settings.animations[animName].loop !== 'undefined' ? Settings.animations[animName].loop : true;
                scalar = typeof Settings.animations[animName].scale !== 'undefined' ? Settings.animations[animName].scale : 1;
            }

            scale = scale * scalar;

            sprite.animations.play('anim', fps, loop, true);

        } else {

            sprite = new Phaser.Sprite(
                this.game,
                x * this.tileWidth,
                y * this.tileWidth,
                key,
                name + '.png');

            scale = (this.tileWidth * (1 - Util.toPerc(padding))) / sprite._frame.width;
        }

        sprite.anchor.set(0.5, 0.5);

        sprite.scale.x = scale;
        sprite.scale.y = scale;

        sprite.x += this.tileWidth * 0.5;
        sprite.y += this.tileWidth * 0.5;

        return sprite;
    }

    createAndFireProjectile(tile, dir) {

        if (!tile.parent || !tile.settings.projectile) {
            return;
        }

        var projectile = this.game.add.group();

        var sprite = this.genSpriteOrAnim(
            'sprites',
            tile.settings.projectile,
            tile.settings.projectile,
            tile.settings.x,
            tile.settings.y,
            '0%');

        sprite.x = 0;
        sprite.y = 0;

        projectile.x = tile.x + tile.parent.x;
        projectile.y = tile.y + tile.parent.y;

        sprite.scale.x = sprite.scale.x * (tile.settings.projectileScale || 1);
        sprite.scale.y = sprite.scale.y * (tile.settings.projectileScale || 1);

        var speed = (this.tileWidth / this.staggerDelay);

        var distance = this.tileWidth * this.boardWidth * 2;

        var time = distance / speed;

        var xDelta = 0;
        var yDelta = 0;

        var xScale = 1;
        var yScale = 1;

        switch (dir) {
            case 'left':
                xDelta -= distance;
                xScale = -1;
                break;
            case 'right':
                xDelta += distance;
                break;
            case 'up':
                yDelta -= distance;
                break;
            case 'down':
                yDelta += distance;
                yScale = -1;
                break;
        }

        sprite.scale.x = sprite.scale.x * xScale;
        sprite.scale.y = sprite.scale.y * yScale;

        Tweener.moveTo(
            projectile,
            projectile.x + xDelta,
            projectile.y + yDelta,
            0,
            time,
            Phaser.Easing.Linear.None);


        if (tile.settings.projectileTrail) {

            var trail = this.genSpriteOrAnim(null, null, 'trail', sprite.x, sprite.y, '0%');

            trail.x = 0 - (sprite.width * 0.03);
            trail.y = 0;

            trail.anchor.set(0.5, 0);

            var trailScaleX = trail.scale.x * (tile.settings.projectileScale || 1) * xScale;
            var trailScaleY = trail.scale.y * (tile.settings.projectileScale || 1) * yScale;

            trail.scale.x = trailScaleX * 0.6;
            trail.scale.y = 0;

            projectile.add(trail);

            Tweener.scaleTo(trail, trailScaleX, trailScaleY * 0.3, 0, 800, Phaser.Easing.Linear.None);
        }

        projectile.add(sprite);


        this.game.world.bringToTop(projectile);

        this.game.add.existing(projectile);
    }

    explode(tile, index, stagger, surpressAnimation) {

        var x = tile.settings.x;
        var y = tile.settings.y;

        var goalItem = this.goals[tile.settings.key];

        this.game.time.events.add(stagger ? this.staggerDelay * index : 0, function() {

            if (tile.settings.projectile) {

                var lProj = tile.settings.destroys === 'horizontal' || tile.settings.destroys === 'left';
                var rProj = tile.settings.destroys === 'horizontal' || tile.settings.destroys === 'right';
                var uProj = tile.settings.destroys === 'vertical' || tile.settings.destroys === 'u';
                var dProj = tile.settings.destroys === 'vertical' || tile.settings.destroys === 'd';

                if (lProj === true) {
                    this.createAndFireProjectile(tile, 'left');
                }
                if (rProj === true) {
                    this.createAndFireProjectile(tile, 'right');
                }
                if (uProj === true) {
                    this.createAndFireProjectile(tile, 'up');
                }
                if (dProj === true) {
                    this.createAndFireProjectile(tile, 'down');
                }
            }

            if (tile.settings.destroyAnim) {

                this.playAnimation(tile, tile.settings.destroyAnim);
            }

            if (typeof goalItem !== 'undefined') {

                if (!tile.parent) {
                    return;
                }

                var clone = this.createTile(tile.settings.key, tile.settings.x, tile.settings.y, Settings.piecePadding);

                clone.x += tile.parent.x;
                clone.y += tile.parent.y;

                this.game.add.existing(clone);

                this.removeTile(tile);

                this.flyToGoal(goalItem, clone);


            } else {

                // if (tile.settings.destroyAnim) {

                //     // this.playAnimation(tile, tile.settings.destroyAnim);

                //     this.playAnimation(tile, 'piece03-destroy');

                //     console.log('hello');
                // } else {

                //     this.playAnimation(tile, tile.settings.key + '-destroy');
                // }

                var anim = tile.settings.destroyAnim || tile.settings.key + '-destroy';
                if(tile.settings.key.indexOf('paw') !== -1){
                    anim = tile.settings.matchesTo + '-destroy';
                }

                console.log(anim);
                var isAnim = this.game.cache.checkImageKey(anim);

                if (!isAnim && tile.settings.key.indexOf('piece') !== -1) {
                    anim = 'piece-destroy';
                }

                isAnim = this.game.cache.checkImageKey(anim);

                if (isAnim === true && surpressAnimation !== true) {

                    this.playAnimation(tile, anim);
                }

                if (Settings.tileScaleDownOnDestroy === true && tile.parent && tile.settings.key.indexOf('booster') === -1) {

                    var tileScaleDown = this.createTile(tile.settings.key, tile.settings.x, tile.settings.y, Settings.piecePadding);

                    tileScaleDown.x += tile.parent.x;
                    tileScaleDown.y += tile.parent.y;

                    this.game.add.existing(tileScaleDown);

                    Tweener.scaleTo(
                        tileScaleDown,
                        tile.scale.x * 1.1,
                        tile.scale.x * 1.1,
                        0,
                        Settings.tileScaleDownOnDestroyDuration * 0.4,
                        Phaser.Easing.Linear.None,
                        function() {

                            Tweener.scaleTo(
                                tileScaleDown,
                                0,
                                0,
                                0,
                                Settings.tileScaleDownOnDestroyDuration * 0.6,
                                Phaser.Easing.Linear.None);
                        });

                }

                this.removeTile(tile);
            }

            if (tile.settings.onDestroyGenerate) {

                this.aboveLayerGrp.add(this.createTile(tile.settings.onDestroyGenerate, x, y, Settings.piecePadding, this.tiles));
            }

            this.removeUnderTile(tile);

        }, this);
    }

    flyToGoal(goalItem, sprite, cb, fox=false) {

        var goal, x, y; 

        if(fox) {
            // goal = goalItem;

            x = this.x + goalItem.x * this.tileWidth + this.tileWidth/2;
            y = this.y + goalItem.y * this.tileWidth + this.tileWidth/2;
        }else{
            goal = this.game.state.states.endcard.goal[goalItem];

            x = goal.x;
            y = goal.y;

            console.log(x + "," + y);

        }

        sprite.settings.goalItem = goalItem; 

        var dist = (this.tileWidth * this.boardWidth) / Phaser.Math.distance(sprite.x, sprite.y, x, y);

        var duration = (dist / this.flySpeed);
        
        var delay = 0;
        if(!fox){
            duration *= 100000;
            delay = 1000;
        }
        else{
            duration = 1000;
            delay = 0;
        }

        this.game.time.events.add(delay, function(){

            this.moveTo(sprite, x, y, duration, Phaser.Easing.Linear.None, function(item) {

                if(!fox) {
                    this.game.onGetGoalItem.dispatch(item.settings.goalItem);

                    item.destroy();

                    if (cb) {
                        cb(item);
                    } 

                }
                
            });

        }, this);

        this.game.time.events.add(delay * 0.4, function(){
             if (!fox) {

                var tween = this.game.add.tween(sprite.scale).to({
                    x: [sprite.scale.x * 2, sprite.scale.x * 2, goal.scale.x],
                    y: [sprite.scale.y * 2, sprite.scale.x * 2, goal.scale.y]
                },
                duration*2,
                Phaser.Easing.Linear.None,
                true,
                0);
            }else {
                var tween = this.game.add.tween(sprite.scale).to({
                    x: [sprite.scale.x * 1.5, sprite.scale.x, 0],
                    y: [sprite.scale.y * 1.5, sprite.scale.y, 0]
                },
                duration,
                Phaser.Easing.Linear.None,
                true,
                0);


            }
        }, this);

        
    }

    removeUnderTile(tile, fox=false) {

        var t = this.getTileAt(tile.settings.x, tile.settings.y, this.belowTiles);

        if (t === null || t.isDead === true) {
            return;
        }

        var index = this.belowTiles.indexOf(t);

        this.belowTiles.splice(index, 1);

        t.isDead = true;

        var amount = Number(t.settings.key.replace('under-piece', ''));

        if (amount > 1) {

            this.belowLayerGrp.add(this.createTile(
                'under-piece0' + (amount - 1),
                t.settings.x,
                t.settings.y,
                Settings.belowPiecePadding,
                this.belowTiles));
        }

        if (amount > 0) {

            var t1, t2;

            this.bottomTiles.forEach(function(bt) {

                t1 = this.getTileAt(bt.settings.x, bt.settings.y - 1, this.belowTiles);
                t2 = this.getTileAt(bt.settings.x, bt.settings.y, this.belowTiles);

                if (t1 === null && t2 === null && bt.isDead !== true) {

                    bt.isDead = true;

                    bt.alpha = 0;

                    var sprite = this.game.add.sprite(0, 0, 'pieces', bt.settings.key + '.png');

                    sprite.x = bt.x + bt.parent.x;
                    sprite.y = bt.y + bt.parent.y;

                    sprite.scale.x = bt.scale.x;
                    sprite.scale.y = bt.scale.y;

                    sprite.anchor.x = bt.anchor.x;
                    sprite.anchor.y = bt.anchor.y;

                    sprite.settings = bt.settings;

                    this.isCollecting = true;

                    var _this = this;

                    Tweener.wobbleScaleIn(sprite, 15, 2, 1.5, function(sprite) {

                        _this.flyToGoal(_this.goals[sprite.settings.key], sprite, function() {

                            if (_this.isCollecting === true) {
                                _this.isCollecting = false;

                                if (_this.isFinishedFalling === true) {

                                    _this.game.time.events.add(500, function() {

                                        _this.game.finishInteraction();

                                    }, _this);
                                }
                            }
                        });
                    });
                }

            }, this);

            Tweener.fade(t, 0, 0, 500, Phaser.Easing.Linear.None, true, function() {

            });
        }
    }

    playAnimation(tile, key, fox=false) {
        if (!tile.parent) {
            return;
        }

        var anim = Settings.animations[key];

        if (anim) {

            var sprite = new Phaser.Sprite(
                this.game,
                tile.x + tile.parent.x,
                tile.y + tile.parent.y,
                key);

            sprite.anchor.set(0.5, 0.5);

            sprite.scale.x = tile.scale.x * (anim.scale || 1) * 5;
            sprite.scale.y = tile.scale.y * (anim.scale || 1) * 5;

            if(fox) {
                sprite.scale.x *= .8;
                sprite.scale.y *= .8;
            }

            sprite.animations.add('anim');

            sprite.animations.play('anim', anim.fps, anim.loop, true);

            this.game.add.existing(sprite);
        }
    }

    getBlastMatches(tile) {

        var blastMatches = [];

        var blastTiles = [];

        switch (tile.settings.destroys) {
            case 'left':
                blastMatches = Blast.left(tile.settings.x, tile.settings.y, this.boardWidth, this.boardHeight);
                break;
            case 'right':
                blastMatches = Blast.right(tile.settings.x, tile.settings.y, this.boardWidth, this.boardHeight);
                break;
            case 'up':
                blastMatches = Blast.up(tile.settings.x, tile.settings.y, this.boardWidth, this.boardHeight);
                break;
            case 'down':
                blastMatches = Blast.down(tile.settings.x, tile.settings.y, this.boardWidth, this.boardHeight);
                break;
            case 'horizontal':
                blastMatches = Blast.horizontal(tile.settings.x, tile.settings.y, this.boardWidth, this.boardHeight);
                break;
            case 'vertical':
                blastMatches = Blast.vertical(tile.settings.x, tile.settings.y, this.boardWidth, this.boardHeight);
                break;
            case 'horizontalAndVertical':
                blastMatches = Blast.horizontalAndVertical(tile.settings.x, tile.settings.y, this.boardWidth, this.boardHeight);
                break;
            case 'blast1':
                blastMatches = Blast.blast1(tile.settings.x, tile.settings.y);
                break;
            case 'blast2':
                blastMatches = Blast.blast2(tile.settings.x, tile.settings.y);
                break;
            case 'colorMatch':
                // todo
                blastMatches = Blast.colorMatch(tile.settings.x, tile.settings.y);
                break;
        }

        blastMatches.forEach(function(bm) {

            blastTiles.push(this.getTileAt(bm.x, bm.y, this.tiles));
        }, this);

        return blastTiles;
    }

    handleMatches(tiles) {

        var matches, booster, matchComps;

        var foundMatch = false;

        var blastMatches;

        var boosterMatchResult;

        var delay = 0;

        var extraDelay = 0;

        var holes = [];

        var paws = 0;

        for (var i = 0; i < tiles.length; i++) {

            if (tiles[i] === null || tiles[i].settings.dontMatch === true) {
                continue;
            }

            blastMatches = [];

            matches = this.getMatches(tiles[i], true, true, true, true, [], Settings.interactionType === 'swipe');
            
            booster = this.getBooster(tiles[i], matches);

            matchComps = this.getMatchComponents(tiles[i], matches);

            if (tiles[i].settings.key.indexOf('booster') === 0) {

                blastMatches = this.getBlastMatches(tiles[i]);
            }

            if ((Settings.interactionType === 'swipe' && (matchComps.h >= 3 || matchComps.v >= 3 || blastMatches.length > 0)) ||
                (Settings.interactionType === 'tap' && (matches.length >= 2 || blastMatches.length > 0))) {

                foundMatch = true;

                matches = matches.concat(blastMatches);

                matches.forEach(function(m) {

                    if (m && m.settings) {
                        m.settings.dontMatch = true;
                    }

                    if (m.settings.key.indexOf('paw') !== -1) {
                        //if there is a paw destroyed, then move the fox
                        paws++;
                    }

                }, this);


                if (booster !== null) {

                    boosterMatchResult = this.boosterMatch(tiles[i], matches, booster);

                    holes = holes.concat(boosterMatchResult.holes);

                    delay = Math.max(delay, boosterMatchResult.delay);

                } else {


                    matches = matches.concat(this.addBlockerMatches(matches));

                    extraDelay = Math.max(extraDelay || 0, tiles[i].settings.delay || 0);

                    holes = holes.concat(this.getHolesFromMatches(tiles[i], matches));

                    holes.push(tiles[i].settings);

                    extraDelay += blastMatches.length * this.staggerDelay;

                    this.explodeMatches(matches, blastMatches.length > 0, tiles[i].settings);
                }
                
            }
        }


        if(Settings.interactionType === 'tap') {
            extraDelay += 500;
        }

        if (foundMatch === false) {

            this.isFinishedFalling = true;

            if (this.isCollecting !== true) {
                // console.log('foundMatch = ' + foundMatch);
                // this.finishInteraction();
            }
        } else {

            this.game.time.events.add(delay + extraDelay + 50, function() {

                var fallResults = this.fall(holes);

                this.game.time.events.add(fallResults.fallInfo.maxTime + 80, function() {

                    if (Settings.interactionType === 'swipe') {

                        this.handleMatches(fallResults.fallTiles);

                        if(paws > 0) {
                            for(var i = 0; i < paws; i++){

                                this.moveFox();
                                // console.log(this.fox.moveDuration)
                            }
                        }    
                    } else {


                        this.game.time.events.add(200, function() {
                            this.toggleTapBoosterIndicators();
                        }, this);


                        this.finishInteraction();
                    }

                }, this);

            }, this);
        }
    }

    addBlockerMatches(matches) {

        var blockerMatches = [];

        var u, d, l, r;

        matches.forEach(function(m) {

            u = this.getTileAt(m.settings.x + 0, m.settings.y - 1, this.tiles);
            d = this.getTileAt(m.settings.x + 0, m.settings.y + 1, this.tiles);
            l = this.getTileAt(m.settings.x - 1, m.settings.y + 0, this.tiles);
            r = this.getTileAt(m.settings.x + 1, m.settings.y + 0, this.tiles);

            if (u !== null && u.settings.key.indexOf('blocker') !== -1) {
                blockerMatches.push(u);
            }

            if (d !== null && d.settings.key.indexOf('blocker') !== -1) {
                blockerMatches.push(d);
            }

            if (l !== null && l.settings.key.indexOf('blocker') !== -1) {
                blockerMatches.push(l);
            }

            if (r !== null && r.settings.key.indexOf('blocker') !== -1) {
                blockerMatches.push(r);
            }

        }, this);

        return blockerMatches;

    }

    getHolesFromMatches(origTile, matches) {

        var holes = [];

        matches.forEach(function(m) {

            if (m !== null) {

                if (!(m.settings.x === origTile.settings.x &&
                        m.settings.y === origTile.settings.y)) {

                    if (!m.settings.onDestroyGenerate) {
                        holes.push(Util.clone(m.settings));
                    }
                }
            }
        }, this);

        return Util.uniq(holes);
    }

    boosterMatch(origTile, matches, booster) {

        var x = origTile.settings.x;
        var y = origTile.settings.y;

        var holes = this.getHolesFromMatches(origTile, matches);

        matches.forEach(function(m) {

            this.moveToLinear(m, origTile.settings.x, origTile.settings.y, this.comboDuration);

            this.removeUnderTile(m);

        }, this);

        var goalItem = this.goals[matches[0].settings.key];

        var boosterGenDelay = typeof goalItem !== 'undefined' ? (matches.length - 1) * this.staggerDelay : 0;

        this.game.time.events.add(this.comboDuration + 30, function() {

            var shouldStagger = typeof this.goals[matches[0].settings.key] !== 'undefined';

            this.explodeMatches(matches, shouldStagger, null, true);

            this.game.time.events.add(boosterGenDelay, function() {

                var boosterTile = this.createTile(booster.key, x, y, Settings.piecePadding, this.tiles);

                boosterTile.settings = Util.extend(boosterTile.settings, booster);

                if (boosterTile.settings.anchor) {
                    boosterTile.anchor.set(boosterTile.settings.anchor.x, boosterTile.settings.anchor.y);
                }

                this.aboveLayerGrp.add(boosterTile);

                boosterTile.origScale = boosterTile.scale.x;

                boosterTile.scale.x = 0;
                boosterTile.scale.y = 0;

                var tween = this.game.add.tween(boosterTile.scale).to({
                        x: boosterTile.origScale,
                        y: boosterTile.origScale
                    },
                    500,
                    Phaser.Easing.Back.Out,
                    true,
                    0);

                tween.onComplete.add(function() {

                    this.game.add.tween(boosterTile.scale).to({
                            x: boosterTile.origScale * 1.1,
                            y: boosterTile.origScale * 0.9
                        },
                        800,
                        Phaser.Easing.Linear.None,
                        true,
                        0, -1).yoyo(true, 0);

                }, this);

            }, this);
        }, this);

        return {
            holes: holes,
            delay: this.comboDuration + boosterGenDelay
        };
    }

    explodeMatches(matches, stagger, orig, surpressAnimation, onMatch = true, paws=0) {
       
        if(onMatch) 
            this.onMatch(matches, paws);

        matches.forEach(function(m, index) {

            if (m !== null) {

                if (orig) {

                    index = Math.max(Math.abs(m.settings.x - orig.x), Math.abs(m.settings.y - orig.y));
                }

                this.explode(m, index, stagger, surpressAnimation);

            }

        }, this);
    }


    onGameComplete() {

        if (Settings.fadeBoardOnComplete === true) {

            Tweener.fade(this.bgLayerGrp, 0, 0, 1000, Phaser.Easing.Linear.None, true);
            Tweener.fade(this.bottomLayerGrp, 0, 0, 1000, Phaser.Easing.Linear.None, true);
            Tweener.fade(this.belowLayerGrp, 0, 0, 1000, Phaser.Easing.Linear.None, true);
            Tweener.fade(this.aboveLayerGrp, 0, 0, 1000, Phaser.Easing.Linear.None, true);
            Tweener.fade(this.overlayLayerGrp, 0, 0, 1000, Phaser.Easing.Linear.None, true);

        }
        
    }

    onMatch(matches, paws) {

        matches.forEach(function(m) {
            if (m && m.settings) {
                if(m.settings.key.indexOf('paw') !== -1){
                    // fly to fox
                    // var targetTile = this.getTileAt(this.fox.x, this.fox.y, this.tiles);

                    var clone = this.genSpriteOrAnim('pieces', m.settings.key, null, m.settings.x, m.settings.y, Settings.piecePadding);
                    clone.settings = {};
                    clone.settings.goalItem = 'fox';

                    clone.x += m.parent.x;
                    clone.y += m.parent.y;

                    this.game.add.existing(clone);


                    // this.removeTile(tile);

                    this.flyToGoal(this.fox, clone, null, true);

                }    
            }
            
        },this);

    }


    fall(holes) {

        this.genNewFallTiles(holes);

        var fallInfo = this.getFallInfo(holes);

        var ttf;

        var fallTiles = [];

        var fallAmount = 0;

        this.tiles.forEach(function(t) {

            fallAmount = 0;

            holes.forEach(function(h) {

                if (h.x === t.settings.x) {
                    fallAmount += (Settings.fallUpwards === true ? h.y < t.settings.y : h.y > t.settings.y) ? 1 : 0;
                }

            }, this);

            if (fallAmount > 0) {

                this.fallTile(t, fallAmount);

                fallTiles.push(t);
            }

        }, this);

        return {
            fallTiles: fallTiles,
            fallInfo: fallInfo
        };
    }

    fallTile(t, dist) {

        var tween = this.game.add.tween(t);

        var yTo = t.y + (dist * this.tileWidth * (Settings.fallUpwards === true ? -1 : 1));

        if (Settings.fallStyle === 'bounce') {

            var cb = new CustomBounce({ strength: Settings.tileBounce });

            var tileBounceScalar = 5;

            tween.to({
                    y: yTo
                },
                Util.calcQuadTime(t.y - yTo) * Settings.tileBounce * tileBounceScalar * (1 / Settings.gravity),
                function(k) {
                    return cb.Bounce.Ease(k);
                },
                true);

        } else {

            tween.to({
                    y: yTo
                },
                Util.calcQuadTime(t.y - yTo) * (1 / Settings.gravity),
                Phaser.Easing.Back.Out,
                true, 0);
        }

        tween.onComplete.add(function(t) {

            t.settings.y = t.settings.y + (dist * (Settings.fallUpwards === true ? -1 : 1));
        }, this);
    }

    getTilesAbove(x, y) {

        var tiles = [];

        this.tiles.forEach(function(t) {

            if (t.settings.x === x && t.settings.y < y) {

                tiles.push(t);
            }
        }, this);

        return tiles;
    }

    getTilesBelow(x, y) {

        var tiles = [];

        this.tiles.forEach(function(t) {

            if (t.settings.x === x && t.settings.y > y) {

                tiles.push(t);
            }
        }, this);

        return tiles;
    }

    getFallInfo(holes) {

        var amount = {};
        var start = {};
        var maxDist;

        var xCoords = [];

        holes.forEach(function(h) {

            amount[h.x] = amount[h.x] || 0;

            amount[h.x]++;

            maxDist = maxDist || amount[h.x];

            if (maxDist < amount[h.x]) {
                maxDist = amount[h.x];
            }

            start[h.x] = Math.max(start[h.x] || h.y, h.y);

            xCoords.push(h.x);

        }, this);

        return {
            amount: amount,
            start: start,
            xCoords: Util.uniq(xCoords),
            maxDist: maxDist,
            maxTime: Util.calcQuadTime(this.tileWidth * maxDist) * (1 / Settings.gravity)
        };
    }

    genNewFallTiles(holes) {

        var newFallTile, y;

        holes.forEach(function(h) {

            if (this.fallPieces[h.x].length === 0) {

                console.error('ran out of fall tiles');
            }

            if (Settings.fallUpwards === true) {

                y = this.getLowestTileY(h.x) + 1;
            } else {

                y = this.getHighestTileY(h.x) - 1;
            }

            newFallTile = this.createTile(
                this.fallPieces[h.x][0],
                h.x,
                y,
                Settings.piecePadding,
                this.tiles);

            this.fallPieces[h.x].shift();

            this.aboveLayerGrp.add(newFallTile);

        }, this);
    }

    getHighestTileY(x) {

        var smallestY = this.boardHeight + 1;

        this.tiles.forEach(function(t) {

            if (t.settings.x === x && t.settings.y < smallestY) {

                smallestY = t.settings.y;
            }
        }, this);

        return Math.min(smallestY, this.highPoints[x]);
    }

    getLowestTileY(x) {

        var biggestY = -1;

        this.tiles.forEach(function(t) {

            if (t.settings.x === x && t.settings.y > biggestY) {

                biggestY = t.settings.y;
            }
        }, this);

        return Math.max(biggestY, this.lowPoints[x]);
    }

    toggleTapBoosterIndicators() {

        var matches, booster, boosterKey;

        this.tiles.forEach(function(t) {

            boosterKey = null;

            matches = this.getMatches(t, true, true, true, true, [], false);

            if (matches.length > 1) {

                this.boosters.forEach(function(b) {

                    b.piecesToCreate.forEach(function(ptc) {

                        if (ptc === matches.length) {
                            boosterKey = b.key;
                        }

                    }, this);

                }, this);

                if (boosterKey !== null) {
                    
                    var clone = this.createTile(t.settings.key, t.settings.x, t.settings.y, Settings.piecePadding);

                    this.aboveLayerGrp.add(clone);

                    Tweener.fade(clone, 0, 0, 150, Phaser.Easing.Linear.None, true, function() {

                        clone.destroy();
                    });

                    t.loadTexture('pieces', t.settings.key + '-' + boosterKey + '.png');
                }
            }

        }, this);

    }

    moveFox() {


        var nextInteraction = Settings['interaction' + this.game.global.interaction];

        // console.log(this.game.global.interaction);
         var t1 = {
            x: this.fox.x,
            y: this.fox.y
        };
        var t2 = {
            x: this.fox.x + 1,
            y: this.fox.y
        };
        var tile1 = this.getTileAt(t1.x, t1.y, this.tiles);//fox
        var tile2 = this.getTileAt(t2.x, t2.y, this.tiles);//the one next to the fox
        tile1.alpha = 0;
        // this.fox.alpha = 0;
        this.playAnimation(tile1, 'fox-destroy', true);

        this.game.time.events.add(this.fox.moveDuration, function(){
            

            if(nextInteraction !== undefined) {
                this.foxMoveToLinear(tile1, t2.x, t2.y, 1000);
                this.moveToLinear(tile2, t1.x, t1.y, 1000);
                this.fox.updatePosition(1, 0);

            }else{

                var holes = [];
                holes.push(tile1.settings);
                this.fall(holes);
                this.fox.updatePosition(1, 0);
                this.foxMoveToLinear(tile1, t2.x, t2.y, 1000, true);

                this.game.time.events.add(1000, function(){
                     var clone = this.genSpriteOrAnim('pieces', tile2.settings.key, null, tile2.settings.x, tile2.settings.y, Settings.piecePadding);
                    clone.settings = {};
                    clone.settings.key = tile2.settings.key;

                    clone.x += tile2.parent.x;
                    clone.y += tile2.parent.y;

                    this.game.add.existing(clone);
                    this.removeTile(tile2);
                    this.flyToGoal(this.goals[clone.settings.key], clone);
                }, this);
            }
    
        },this);
        
       



    }

    finishInteraction() {

        var interaction = Settings['interaction' + (this.game.global.interaction - 1)];

        if (interaction.actions) {
            this.processActions(interaction);
        }

        if (interaction.surpressComplete) {
            return;
        }

        this.game.onInteractionComplete.dispatch();

    }

    processActions(interaction) {

        interaction.actions.forEach(function(a) {

            this.processAction(a);
        }, this);
    }

    processAction(action) {

        this.game.time.events.add(action.delay || 0, function() {

            this[action.action](action);
        }, this);

    }

    floatText(action) {

        action = Util.extend(Settings.floatText, action || {});

        var txt = new Phaser.Text(this.game, 0, 0, action.text || '', action.style);

        txt.anchor.set(0.5, 0.5);

        txt.x = action.x || 0;
        txt.y = action.y || 0;

        if (typeof action.tileX !== 'undefined' && typeof action.tileY !== 'undefined') {

            txt.x = this.elRect.left * window.devicePixelRatio + (action.tileX * this.tileWidth) + (this.tileWidth * 0.5);
            txt.y = this.elRect.top * window.devicePixelRatio + (action.tileY * this.tileWidth) + (this.tileWidth * 0.5);
        }

        if (action.offsetX) {
            txt.x += this.tileWidth * action.offsetX;
        }

        if (action.offsetY) {
            txt.y += this.tileWidth * action.offsetY;
        }

        var desiredWidth = this.tileWidth;

        var scale = desiredWidth / txt.width;

        txt.scale.x = scale * (action.scale || 1);
        txt.scale.y = scale * (action.scale || 1);

        var distance = action.distance ? action.distance * this.tileWidth : this.tileWidth;

        Tweener.scaleThenFade(
            txt,
            action.delay || 0,
            action.duration || 2000);

        this.game.add.existing(txt);
    }

    transformTiles(action) {

        action.tiles.forEach(function(t) {
            this.transformTile(t);
        }, this);
    }

    fallBoard() {

        var holes = [];

        this.boardLayout.forEach(function(bl) {

            if (this.getTileAt(bl.x, bl.y, this.tiles) === null) {

                holes.push({
                    x: bl.x,
                    y: bl.y
                });
            }
        }, this);

        this.fall(holes);
    }

    endInteraction() {
        this.game.onInteractionComplete.dispatch();
    }

    transformTile(t) {

        this.game.time.events.add(t.delay || 0, function() {

            var tile = this.getTileAt(t.x, t.y, this.tiles);

            if (tile !== null) {

                tile.loadTexture('pieces', t.tile + '.png');

                Tweener.scaleIn(tile);

                tile.settings.key = t.tile;

                this.boosters.forEach(function(b) {
                    if (b.key === t.tile) {
                        tile.settings = Util.extend(tile.settings, b);
                    }
                }, this);
            }
        }, this);
    }

    destroyTiles(action) {

        var tile, tilesToDestroy;

        action.tiles.forEach(function(t) {

            this.game.time.events.add(t.delay || 0, function() {

                tile = this.getTileAt(t.x, t.y, this.tiles);

                if (tile) {

                    tilesToDestroy = this.getBlastMatches(tile);

                    tilesToDestroy.forEach(function(ttd) {

                        if (ttd !== null) {

                            this.explode(ttd);

                            tile = this.getTileAt(ttd.settings.x, ttd.settings.y, this.tiles);

                            tile.settings.isDestroyed = true;
                        }
                    }, this);
                }

                this.game.time.events.add(50, function() {

                    if (t.floatText) {

                        t.floatText.tileX = t.x;
                        t.floatText.tileY = t.y;

                        this.floatText(t.floatText);
                    }
                }, this);
            }, this);
        }, this);
    }

    onInteract() {

        if (this.game.global.gameComplete === true) {
            return;
        }

        this.isCollecting = false;
        this.isFinishedFalling = false;
        
        var interaction = Settings['interaction' + this.game.global.interaction]
        
        if (!interaction) {
            return;
        }

        if (interaction.destroyTiles) {

            var tile = this.getTileAt(interaction.destroyTiles[0].x, interaction.destroyTiles[0].y, this.tiles);

            this.handleMatches([tile]);

            return;
        }

        if (Settings.interactionType === 'swipe') {
            this.swipe(interaction);
        }

        if (Settings.interactionType === 'tap') {
            this.tap(interaction);
        }
    }

    onGameComplete() {

        if (Settings.fadeBoardOnComplete === true) {
            this.game.add.tween(this.bgLayerGrp).to({alpha: .5}, 1000, Phaser.Easing.Linear.easeOut, true);
            this.game.add.tween(this.bottomLayerGrp).to({alpha: .8}, 1000, Phaser.Easing.Linear.easeOut, true);
            this.game.add.tween(this.belowLayerGrp).to({alpha: .8}, 1000, Phaser.Easing.Linear.easeOut, true);
            this.game.add.tween(this.aboveLayerGrp).to({alpha: .8}, 1000, Phaser.Easing.Linear.easeOut, true);
            // Tweener.fade(this.bgLayerGrp, 0, 0, 1000, Phaser.Easing.Linear.None, true);
            // Tweener.fade(this.bottomLayerGrp, 0, 0, 1000, Phaser.Easing.Linear.None, true);
            // Tweener.fade(this.belowLayerGrp, 0, 0, 1000, Phaser.Easing.Linear.None, true);
            // Tweener.fade(this.aboveLayerGrp, 0, 0, 1000, Phaser.Easing.Linear.None, true);
            // Tweener.fade(this.overlayLayerGrp, 0, 0, 1000, Phaser.Easing.Linear.None, true);

        }
    }
}

export default Board;