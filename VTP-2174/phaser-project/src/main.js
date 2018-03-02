   import Settings from '../settings';
   import PublishSettings from '../publish-settings';
   import Boot from './states/boot';
   import Endcard from './states/endcard';
   import Preloader from './states/preloader';

   const game = new Phaser.Game(
       window.innerWidth * window.devicePixelRatio,
       window.innerHeight * window.devicePixelRatio,
       Phaser.CANVAS,
       'game',
       null,
       true);

       var overide = PublishSettings.publish[Settings.settingsOveride];
       
   if (Settings.settingsOveride && PublishSettings.publish[Settings.settingsOveride]) {

       for (var key in PublishSettings.publish[Settings.settingsOveride]) {
           if (PublishSettings.publish[Settings.settingsOveride].hasOwnProperty(key)) {

               Settings[key] = PublishSettings.publish[Settings.settingsOveride][key];
           }
       }
   }

   game.state.add('boot', new Boot());
   game.state.add('endcard', new Endcard());
   game.state.add('preloader', new Preloader());

   game.state.start('boot');

   var close = document.getElementById('vungle-close');

   if (Settings.timer === false) {

       close.className = '';

       setTimeout(function() {
           close.style.WebkitTransition = 'opacity 0.5s';
       }, 0);
   }