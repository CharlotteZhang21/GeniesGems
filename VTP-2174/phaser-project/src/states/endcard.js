  import * as Tweener from '../utils/tweener';
  import * as Util from '../utils/util';
  import Board from '../prefabs/board';
  import CustomEffects from '../prefabs/custom-effects';
  import Goal from '../prefabs/goal';
  import Instructions from '../prefabs/instructions';
  import Settings from '../../settings';
  import Localization from '../../localization';

  class Endcard extends Phaser.State {

      constructor() {
          super();
      }

      create() {

          this.game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
          this.game.scale.setUserScale((1 / window.devicePixelRatio), (1 / window.devicePixelRatio), 0, 0);

          this.game.time.events.removeAll();

          this.close = document.getElementById('vungle-close');

          this.createItems();
          this.setupInputListeners();

          this.autoInteract();

          this.game.global.canInteract = false;
          this.game.global.isInteracting = false;

          // short wait
          this.game.time.events.add(700, function() {

              this.game.global.canInteract = true;
              this.game.global.isInteracting = false;


          }, this);

          this.game.onInteract.add(this.onInteract, this);
          this.game.onInteractionComplete.add(this.onInteractionComplete, this);
          this.game.onGameComplete.add(this.onGameComplete, this);
      }

      setupInputListeners() {

          if (Settings.interactionType === 'tap') {

              this.game.input.onUp.add(function(pointer) {

                  if (!Util.isWithinDomEl(pointer.position.x, pointer.position.y, 'board-inner')) {
                      return;
                  }

                  this.interact();

              }, this);
          }

          if (Settings.interactionType === 'swipe') {

              this.game.input.onUp.add(function(pointer) {

                  if (!Util.isWithinDomEl(pointer.position.x, pointer.position.y, 'board-inner')) {
                      return;
                  }

                  this.interact();

              }, this);
          }
      }


      interact() {
          if (this.game.global.canInteract === true) {

              if (this.game.global.gameComplete === true && this.game.global.isInteracting !== true) {
                  return;
              }

              if (this.autoInteractTimer) {

                  this.game.time.events.remove(this.autoInteractTimer);
              }

              this.game.global.isInteracting = true;

              this.game.time.events.add(Settings.timerDuration, function() {

                  this.close.className = '';
              }, this);

              this.game.global.canInteract = false;

              this.instructions.hide();


              this.game.time.events.add(Settings.interactionDelay || 0, function() {
                  this.game.onInteract.dispatch();
                  this.game.global.interaction++;
              }, this);

          }
      }

      createItems() {

          if (Settings.goal1 || Settings.goal2 || Settings.goal3) {
              this.goal = new Goal(this.game);
          }

          this.cta = this.createItem('sprites', 'cta', 'cta-start');

          this.cta.inputEnabled = true;
          this.cta.events.onInputDown.add(function(a) {

              doSomething('download');

          }, this);

          this.board = new Board(this.game);
          this.instructions = new Instructions(this.game, this.board);



          this.logo = this.createItem('sprites', 'logo', 'logo');

          this.logo.alpha = 0;

          this.customEffects = new CustomEffects(this.game);
      }

      createItem(key, name, el) {

          var sprite = this.game.add.sprite(0, 0, key, name.replace('.png', '') + '.png');

          sprite.anchor.set(0.5, 0.5);

          Util.spriteToDom(el, sprite);

          return sprite;
      }

      render() {
          // render code here
      }

      autoInteract() {

          this.canAutoInteract = true;

          this.autoInteractTimer = this.game.time.events.add(Settings.autoPlayAfter, function() {

              if (this.canAutoInteract === true) {

                  this.interact();
              }
          }, this);
      }

      onInteract() {

          // this.game.time.events.add(2000, function() {

          //     this.game.onInteractionComplete.dispatch();
          // }, this);
      }

      onInteractionComplete() {

          if (this.game.global.gameComplete === true) {
              return;
          }

          if (Settings['interaction' + this.game.global.interaction]) {

              this.instructions = new Instructions(this.game, this.board);

              this.autoInteract();
          } else {

              // no more instructions left, win
              this.game.onGameComplete.dispatch();
          }

          // short wait
          this.game.time.events.add(700, function() {

              this.game.global.canInteract = true;
              this.game.global.isInteracting = false;
          }, this);
      }

      onGameComplete() {

          this.game.global.gameComplete = true;

          Tweener.moveToDom(
              this.cta,
              'cta-end',
              Settings.ctaMoveDelay,
              Settings.ctaMoveDuration,
              Phaser.Easing.Quadratic.Out,
              function(sprite) {

                  Tweener[Settings.ctaAnimation](sprite, Settings.ctaAnimationDelay, Settings.ctaAnimationDuration);
              });

          if (Settings.finalScene) {

              this.game.time.events.add(Settings.finalScene.delay, function() {

                  this.createFinalScene(Settings.finalScene);
              }, this);
          }
      }

      createFinalScene(finalScene) {

          this.finalSceneBg = this.createFinalSceneBg(finalScene);

          this.finalSceneCta = this.createFinalSceneCta(finalScene);

          this.createFinalScenePanel(finalScene);

          this.createFinalSceneTooltip(finalScene);

          this.tutorialActive = true;

          this.createTutorialHand(finalScene);

          this.tweenTutorialHand(finalScene);

          this.game.onFinalScene.dispatch();
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

      createFinalSceneTooltip(finalScene) {

          if (!finalScene.tooltip) {
              return;
          }

          this.tooltipGrp = this.game.add.group();

          this.tooltip = this.createItem('sprites', finalScene.tooltipSprite, finalScene.tooltipHtmlId);
          this.tooltipText = this.createText();

          this.tooltipText.setText(Localization[finalScene.tooltip.replace('{{', '').replace('}}', '')])

          Util.textToDom(finalScene.tooltipTextHtmlId, this.tooltipText);

          this.tooltipGrp.add(this.tooltip);
          this.tooltipGrp.add(this.tooltipText);

          this.tooltipGrp.alpha = 0;

          Tweener.fade(this.tooltipGrp, 1, 0, 1000, Phaser.Easing.Linear.None);

          Tweener.moveTo(this.tooltipGrp, this.tooltipGrp.x, this.tooltipGrp.y + 100, 0, 1000, Phaser.Easing.Quadratic.Out);

          this.game.time.events.add(1000 * 6, function() {

              Tweener.fade(this.tooltipGrp, 0, 0, 600, Phaser.Easing.Linear.None);

              Tweener.moveTo(this.tooltipGrp, this.tooltipGrp.x, this.tooltipGrp.y - 30, 0, 600, Phaser.Easing.Quadratic.Out);

          }, this);
      }

      createFinalSceneCta(finalScene) {

          var cta = this.createItem('sprites', finalScene.cta, finalScene.ctaHtmlId);

          cta.alpha = 0;

          Tweener.fade(cta, 1, 0, 1000, Phaser.Easing.Linear.None);

          this.game.time.events.add(1000, function() {

              Tweener[Settings.ctaAnimation](cta, 0, 1000);
          }, this);

          this.cta.inputEnabled = false;

          cta.inputEnabled = true;

          cta.events.onInputDown.add(function(a) {

              doSomething('download');

          }, this);

          return cta;
      }

      createFinalSceneBg(finalScene) {

          var finalSceneBg = this.createItem('sprites', finalScene.bg, finalScene.bgHtmlId);

          finalSceneBg.x = this.game.world.centerX;
          finalSceneBg.y = this.game.world.centerY;

          finalSceneBg.alpha = 0;

          var scale;

          if (Util.isPortrait() === true) {

              scale = this.game.world.height / finalSceneBg._frame.sourceSizeH;

          } else {

              scale = this.game.world.width / finalSceneBg._frame.sourceSizeW;
          }

          finalSceneBg.scale.x = scale;
          finalSceneBg.scale.y = scale;

          // this.sofa = this.createSofa(finalSceneBg, 'sofa_03');

          Tweener.fade(finalSceneBg, 1, 0, 1000, Phaser.Easing.Linear.None);

          return finalSceneBg;
      }

      createFinalScenePanel(finalScene) {

          var panel = this.createItem('sprites', finalScene.panel.sprite, finalScene.panel.htmlId);

          this.finalScenePanelItems = [];

          var selectItem, deselectItem;

          for (var i = 0; i < finalScene.panel.items.length; i++) {

              deselectItem = this.createItem(
                  'sprites',
                  finalScene.panel.items[i].deselect,
                  finalScene.panel.items[i].htmlId);

              selectItem = this.createItem(
                  'sprites',
                  finalScene.panel.items[i].select,
                  finalScene.panel.items[i].htmlId);

              selectItem.finalSceneItem = {
                  item: finalScene.panel.items[i].item,
                  itemXOffset: finalScene.panel.items[i].itemXOffset,
                  itemYOffset: finalScene.panel.items[i].itemYOffset,
                  itemScale: finalScene.panel.items[i].itemScale
              };

              selectItem.inputEnabled = true;
              selectItem.events.onInputDown.add(this.finalSceneItemClick, this);

              deselectItem.inputEnabled = true;
              deselectItem.events.onInputDown.add(this.finalSceneItemClick, this);

              selectItem.alpha = 0;
              deselectItem.alpha = 0;

              // Tweener.fade(this['sofaItemSelect' + (i + 1)], 1, 0, 1000, Phaser.Easing.Linear.None);
              Tweener.fade(deselectItem, 1, 0, 1000, Phaser.Easing.Linear.None);

              this.finalScenePanelItems.push({
                  selectItem: selectItem,
                  deselectItem: deselectItem
              });
          }

          panel.alpha = 0;

          Tweener.fade(panel, 1, 0, 1000, Phaser.Easing.Linear.None);
      }

      createFinalSceneItem(finalSceneBg, itemName, itemScale) {

          var xOffset = Util.toPerc(Settings.finalScene.itemPositionX);
          var yOffset = Util.toPerc(Settings.finalScene.itemPositionY);
          var scale = Settings.finalScene.itemScale;

          var item = this.createItem('sprites', itemName, Settings.finalScene.bgHtmlId);

          item.x = finalSceneBg.x + (finalSceneBg.width * xOffset) - (finalSceneBg.width * 0.5);
          item.y = finalSceneBg.y + (finalSceneBg.height * yOffset) - (finalSceneBg.height * 0.5);

          var scale = finalSceneBg.scale.x * scale;

          item.scale.x = 0;
          item.scale.y = 0;

          Tweener.scaleTo(item, scale * (itemScale || 1), scale * (itemScale || 1), 0, 800, Phaser.Easing.Elastic.Out);

          return item;
      }

      finalSceneItemClick(sprite) {

          this.tutorialActive = false;

          if (this.finalSceneItem) {
              this.finalSceneItem.destroy();
          }

          this.finalSceneItem = this.createFinalSceneItem(this.finalSceneBg, sprite.finalSceneItem.item, sprite.finalSceneItem.itemScale);

          this.finalSceneItem.x += this.finalSceneBg.width * (Util.toPerc(sprite.finalSceneItem.itemXOffset) || 0);
          this.finalSceneItem.y += this.finalSceneBg.height * (Util.toPerc(sprite.finalSceneItem.itemYOffset) || 0);

          this.finalScenePanelItems.forEach(function(item) {

              item.selectItem.alpha = 0;
              item.deselectItem.alpha = 1;

              if (item.selectItem.finalSceneItem.item === sprite.finalSceneItem.item) {
                  item.selectItem.alpha = 1;
                  item.deselectItem.alpha = 1;
              }

          }, this);
      }

      createTutorialHand(finalScene) {

          this.hand = this.createItem('sprites', finalScene.tutorialHand, finalScene.tutorialHandHtmlId);

          this.hand.x += this.hand.width * 0.5;
          this.hand.y += this.hand.height * 0.5;

          this.hand.alpha = 0;

      }

      tweenTutorialHand(count) {

          count = count || 0;

          if (count > 2) {
              return;
          }

          if (this.tutorialActive !== true) {
              return;
          }

          var alpha = 1;

          var origScale = this.hand.scale.x;

          this.hand.scale.x = origScale * (Settings.finalScene.tutorialHandScale || 1);
          this.hand.scale.y = origScale * (Settings.finalScene.tutorialHandScale || 1);

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

                  this.tweenTutorialHand(count + 1);
              }, this);
          }, this);
      }

      removeTutorial() {

          if (this.tutorialActive === false) {
              return;
          }

          this.tutorialActive = false;

          this.game.add.tween(this.tutorialHand).to({ alpha: 0 }, 300, Phaser.Easing.Linear.None, true);
          this.game.add.tween(this.pulse).to({ alpha: 0 }, 300, Phaser.Easing.Linear.None, true);
      }

      update() {

          this.customEffects.sortLayers();
      }
  }

  export default Endcard;