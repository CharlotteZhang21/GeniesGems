 import Tile from '../prefabs/tile';
 import Lightning from '../prefabs/lightning';
 import * as TileUtil from '../utils/tile-util';
 import * as Util from '../utils/util';


 // called when a tile lands
 export function onTileLand(tile) {

     // console.log('onTileLand');
 }

 // called when a combo of x2 booster tiles has started
 export function onComboStart(game, tile1, tile2, explosion) {

     if (explosion && explosion.destroyAll === true) {
         destroyAllAnimation(game, tile1, tile2, explosion);

         tile1.properties.noEmit = true;
         tile2.properties.noEmit = true;

         return;
     }

     if (explosion &&
         // explosion.vertical === true &&
         explosion.horizontal === true &&
         explosion.blastRadius === 1) {
         destroyWrappedAndStripe(game, tile1, tile2, explosion);

         return;
     }

     if (explosion &&
         explosion.horizontal === true &&
         explosion.vertical === true) {

         tile1.properties.noEmit = true;
         tile2.properties.noEmit = true;

         emitEnergyStripe(
             game,
             tile1.parent.x + tile1.x,
             tile1.parent.y + tile1.y,
             tile1.width,
             tile1.scale.x,
             true,
             true);

         return;
     }


     if (explosion &&
         explosion.horizontal === true &&
         explosion.vertical === true) {

         tile1.properties.noEmit = true;
         tile2.properties.noEmit = true;

         emitEnergyStripe(
             game,
             tile1.parent.x + tile1.x,
             tile1.parent.y + tile1.y,
             tile1.width,
             tile1.scale.x,
             true,
             true);

         return;
     }


     if (explosion &&
         explosion.colorMatch === true) {

         createLightning(game, tile1, tile2, explosion);

         return;
     }

 }

 // called when a tile has been destroyed
 export function onTileDestroy(tile, tileInfo) {

     if (tile === null || tile.parent === null || tile.properties.noEmit === true) {
         return;
     }

     switch (tileInfo.explode) {
         case 'horizontal':
         case 'vertical':

             emitEnergyStripe(
                 tile.game,
                 tile.parent.x + tile.x,
                 tile.parent.y + tile.y,
                 tile.width,
                 tile.scale.x,
                 tileInfo.explode === 'vertical',
                 tileInfo.explode === 'horizontal');

             break;
             // case 'colorMatch':

             //     this.createLightning(game, tile1, tile2, explosion);
             //     break;
     }
 }


 function createLightning(game, tile1, tile2, explosion) {

     var tile = tile1.properties.color === 'any' ? tile1 : tile2;

     var adjTile = tile1.properties.color !== 'any' ? tile1 : tile2;

     var color = PiecSettings.tiles[adjTile.properties.tileType].color;

     var tiles = TileUtil.getAllTilesByColor(game.global.tiles, adjTile.properties.color);

     var electricAnim = tile.getAnimation('master-energy-charge');

     var energy = tile.playAnimation(game, game.state.states.endcard.grid, electricAnim);

     var lightnings = [];

     tiles.forEach(function(t) {

         lightnings.push(new Lightning(
             game,
             tile.x + game.state.states.endcard.grid.x,
             tile.y + game.state.states.endcard.grid.y,
             t.x + game.state.states.endcard.grid.x,
             t.y + game.state.states.endcard.grid.y));

     }, this);

     game.time.events.add(explosion.destroyDelay, function() {

         energy.destroy();

         lightnings.forEach(function(l) {

             l.destroy();

         }, this);
     }, this);
 }


 function emitEnergyStripe(game, x, y, width, scale, vertical, horizontal) {

     if (vertical === false && horizontal === false) {
         return;
     }

     if (game === null) {
         return;
     }

     var energyStripes = [];

     if (horizontal === true) {

         energyStripes.push(createEnergyStripe(game, x, y, width, scale, 'left'));
         energyStripes.push(createEnergyStripe(game, x, y, width, scale, 'right'));
     }

     if (vertical === true) {

         energyStripes.push(createEnergyStripe(game, x, y, width, scale, 'up'));
         energyStripes.push(createEnergyStripe(game, x, y, width, scale, 'down'));
     }

     var energyStripeSpeed = 150;

     var distance = 0;

     var time = 0;

     energyStripes.forEach(function(r) {

         if (r.tweenTo.x) {
             distance = Math.abs(x - r.tweenTo.x);
         }

         if (r.tweenTo.y) {
             distance = Math.abs(y - r.tweenTo.y);
         }

         time = (distance / energyStripeSpeed) * 100;

         game.add.tween(r).to(r.tweenTo, time, Phaser.Easing.Linear.None, true);

     }, this);
 }

 function createEnergyStripe(game, x, y, width, scale, facing) {

     if (game === null) {
         return;
     }

     var angle = 0;

     var tweenTo = {};

     var energyStripe = new Phaser.Sprite(game, 0, 0, 'energy-stripe');

     energyStripe.scale.x = scale * 0.5;
     energyStripe.scale.y = scale * 0.5;

     energyStripe.x = x;
     energyStripe.y = y;

     switch (facing) {
         case 'left':
             angle = 270;
             tweenTo = {
                 x: -1 * (width * scale)
             };
             break;
         case 'right':
             angle = 90;
             tweenTo = {
                 x: game.world.bounds.width + (width * scale)
             };
             break;
         case 'up':
             angle = 0;
             tweenTo = {
                 y: -1 * (energyStripe.height * scale)
             };
             break;
         case 'down':
             angle = 180;
             tweenTo = {
                 y: game.world.bounds.height + (energyStripe.height * scale)
             };
             break;
     }

     tweenTo.height = energyStripe.height;

     tweenTo.alpha = [0.3, 0];

     energyStripe.alpha = 0.3;

     energyStripe.height = energyStripe.height * 0.8;

     energyStripe.angle = angle;

     energyStripe.tweenTo = tweenTo;

     energyStripe.anchor.setTo(0.5, 0.5);

     game.add.existing(energyStripe);

     return energyStripe;
 }

 function destroyAllAnimation(game, tile1, tile2, explosion) {

     var verticalMatch = tile1.x === tile2.x;

     var tweenTo;

     if (verticalMatch === true) {

         tweenTo = {
             y: Math.min(tile1.y, tile2.y) + (Math.abs(tile1.y - tile2.y) * 0.5)
         };
     } else {

         tweenTo = {
             x: Math.min(tile1.x, tile2.x) + (Math.abs(tile1.x - tile2.x) * 0.5)
         };
     }

     var masterEnergyChargeAnim = tile1.getAnimation('master-energy-charge');

     var haloAnim = tile1.getAnimation('halo');

     var tween1 = game.add.tween(tile1).to(tweenTo, 250, Phaser.Easing.Linear.None, true);
     var tween2 = game.add.tween(tile2).to(tweenTo, 250, Phaser.Easing.Linear.None, true);

     tween1.onComplete.add(function() {

         var x = tile1.x + tile1.parent.x;
         var y = tile1.y + tile1.parent.y;

         var masterEnergyCharge = tile1.playAnimation(game, tile1.parent, masterEnergyChargeAnim);

         game.time.events.add(1100, function() {

             var haloSprite = tile1.playAnimation(game, tile1.parent, haloAnim, false, x, y);

             haloSprite.scale.x = 0;
             haloSprite.scale.y = 0;

             var tween3 = game.add.tween(haloSprite.scale).to({
                 x: 10,
                 y: 10
             }, 500, Phaser.Easing.Linear.None, true);

             var tween4 = game.add.tween(haloSprite).to({
                 alpha: 0
             }, 500, Phaser.Easing.Quadratic.Out, true);

             masterEnergyCharge.destroy();
         }, this);

     }, this);

 }

 function destroyWrappedAndStripe(game, tile1, tile2, explosion) {

     var hEmitters = [];
     var vEmitters = [];

     for (y = -1; y <= 1; y++) {

         for (x = -1; x <= 1; x++) {

             if (game.global.tiles[tile1.properties.y + y] &&
                 game.global.tiles[tile1.properties.y + y][tile1.properties.x + x] !== null) {


                 if (x === 0) {
                     hEmitters.push({
                         x: game.global.tiles[tile1.properties.y + y][tile1.properties.x + x].x + tile1.parent.x,
                         y: game.global.tiles[tile1.properties.y + y][tile1.properties.x + x].y + tile1.parent.y
                     });
                 }

                 if (y === 0) {
                     vEmitters.push({
                         x: game.global.tiles[tile1.properties.y + y][tile1.properties.x + x].x + tile1.parent.x,
                         y: game.global.tiles[tile1.properties.y + y][tile1.properties.x + x].y + tile1.parent.y
                     });
                 }

             }
         }
     }

     var y, x;

     var horizType = TileUtil.getTileTypes(tile1.properties.color, 'horizontal')[0];

     var horizBig = game.add.sprite(
         tile1.x + tile1.parent.x,
         tile1.y + tile1.parent.y,
         'tiles',
         PiecSettings.tiles.indexOf(horizType));

     horizBig.scale.x = tile1.scale.x;
     horizBig.scale.y = tile1.scale.y;

     horizBig.anchor.set(0.5, 0.5);

     horizBig.alpha = 0.5;

     var vertType = TileUtil.getTileTypes(tile1.properties.color, 'vertical')[0];

     var width = tile1.width;
     var scale = tile2.scale.x;

     var vertBig = game.add.sprite(
         tile1.x + tile1.parent.x,
         tile1.y + tile1.parent.y,
         'tiles',
         PiecSettings.tiles.indexOf(vertType));

     vertBig.scale.x = tile1.scale.x;
     vertBig.scale.y = tile1.scale.y;

     vertBig.anchor.set(0.5, 0.5);

     vertBig.alpha = 0;

     var motionBlurH = game.add.sprite(
         tile1.x + tile1.parent.x,
         tile1.y + tile1.parent.y,
         tile1.properties.color + '-motion-blur-h');

     motionBlurH.scale.x = tile1.scale.x * 3;
     motionBlurH.scale.y = tile1.scale.y * 3;

     motionBlurH.anchor.set(0.5, 0.5);

     motionBlurH.alpha = 0;

     var motionBlurV = game.add.sprite(
         tile1.x + tile1.parent.x,
         tile1.y + tile1.parent.y,
         tile1.properties.color + '-motion-blur-v');

     motionBlurV.scale.x = tile1.scale.x * 3;
     motionBlurV.scale.y = tile1.scale.y * 3;

     motionBlurV.anchor.set(0.5, 0.5);

     motionBlurV.alpha = 0;

     var tween1 = game.add.tween(horizBig.scale).to({
         x: tile1.scale.x * 3,
         y: tile1.scale.y * 3
     }, 400, Phaser.Easing.Linear.None, true);

     var tween2 = game.add.tween(horizBig).to({
         alpha: 1
     }, 400, Phaser.Easing.Quadratic.In, true);

     tween1.onComplete.add(function() {

         var tween3 = game.add.tween(horizBig).to({
             alpha: 0
         }, 125, Phaser.Easing.Quadratic.In, true, 0);

         var tween4 = game.add.tween(horizBig.scale).to({
             x: 4
         }, 250, Phaser.Easing.Quadratic.In, true, 0);

         var tween13 = game.add.tween(motionBlurH).to({
             alpha: 1
         }, 125, Phaser.Easing.Quadratic.Out, true, 0);

         var tween14 = game.add.tween(motionBlurH).to({
             alpha: 0
         }, 125, Phaser.Easing.Quadratic.In);

         tween13.chain(tween14);

         var tween15 = game.add.tween(motionBlurH.scale).to({
             x: 6
         }, 250, Phaser.Easing.Quadratic.In, true, 0);

         game.time.events.add(0, function() {

             hEmitters.forEach(function(hEmitter) {

                 emitEnergyStripe(game, hEmitter.x, hEmitter.y, width, scale, false, true);

             }, this);
         }, this);

         tween3.onComplete.add(function() {

             vertBig.alpha = 0.5;

             var tween5 = game.add.tween(vertBig.scale).to({
                 x: vertBig.scale.x * 3,
                 y: vertBig.scale.y * 3
             }, 500, Phaser.Easing.Linear.None, true);

             var tween6 = game.add.tween(vertBig).to({
                 alpha: 1
             }, 500, Phaser.Easing.Quadratic.In, true);

             tween5.onComplete.add(function() {

                 var tween7 = game.add.tween(vertBig).to({
                     alpha: 0
                 }, 250, Phaser.Easing.Quadratic.In, true, 0);

                 var tween8 = game.add.tween(vertBig.scale).to({
                     y: 4
                 }, 250, Phaser.Easing.Quadratic.In, true, 0);


                 var tween17 = game.add.tween(motionBlurV).to({
                     alpha: 1
                 }, 125, Phaser.Easing.Quadratic.In, true, 0);

                 var tween18 = game.add.tween(motionBlurV).to({
                     alpha: 0
                 }, 125, Phaser.Easing.Quadratic.In);

                 tween17.chain(tween18);

                 var tween19 = game.add.tween(motionBlurV.scale).to({
                     y: 6
                 }, 250, Phaser.Easing.Quadratic.In, true, 0);

                 game.time.events.add(0, function() {

                     vEmitters.forEach(function(vEmitter) {

                         emitEnergyStripe(game, vEmitter.x, vEmitter.y, width, scale, true, false);

                     }, this);
                 }, this);

             }, this);

         }, this);

     }, this);

     for (y = -1; y <= 1; y++) {

         for (x = -1; x <= 1; x++) {

             if (game.global.tiles[tile1.properties.y + y] &&
                 game.global.tiles[tile1.properties.y + y][tile1.properties.x + x] !== null) {

                 game.global.tiles[tile1.properties.y + y][tile1.properties.x + x].alpha = 0;
                 game.global.tiles[tile1.properties.y + y][tile1.properties.x + x].properties.color = 'nevermatch';
                 // game.global.tiles[tile1.properties.y + y][tile1.properties.x + x].properties.indestructable = true;

                 // game.global.tiles[tile1.properties.y + y][tile1.properties.x + x].destroy();
                 // game.global.tiles[tile1.properties.y + y][tile1.properties.x + x] = null;

             }
         }
     }

     game.global.freezeCols = [tile1.properties.x - 1, tile1.properties.x, tile1.properties.x + 1];

 }
