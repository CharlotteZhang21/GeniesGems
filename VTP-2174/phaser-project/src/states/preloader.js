 import * as Atlas from '../atlas/index';
 import * as Util from '../utils/util';
 import Settings from '../../settings';

 class Preloader extends Phaser.State {

     constructor() {
         super();
         this.asset = null;
     }

     preload() {

         //Setup loading and its events
         this.load.onLoadComplete.addOnce(this.onLoadComplete, this);
         this.loadResources();
     }

     update() {}

     loadResources() {

         var defaultAnimation = {
             fps: 30,
             loop: false
         };

         this.game.global.animations = {};

         for (var key in Atlas.default) {
             if (Atlas.default.hasOwnProperty(key)) {

                 this.game.load.atlasJSONHash(
                     key,
                     PiecSettings.assetsDir + key + '.png',
                     null,
                     Atlas.default[key]);

                 this.game.global.animations[key] = Util.extend(
                     defaultAnimation,
                     Settings.animations[key] || {}
                 );
             }
         }
     }

     onLoadComplete() {
         this.game.state.start('endcard');
     }
 }

 export default Preloader;