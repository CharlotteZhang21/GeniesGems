class Boot extends Phaser.State {

    constructor() {
        super();
    }

    preload() {}

    init() {

        var game = this.game;

        // custom game events here        
        game.onGameComplete = new Phaser.Signal(); // generic event hook
        game.onInteract = new Phaser.Signal();
        game.onInteractionComplete = new Phaser.Signal();
        game.onFinalScene = new Phaser.Signal();
        game.onGetGoalItem = new Phaser.Signal();

        window.onresize = function() { 

            game.scale.setGameSize(document.body.clientWidth * window.devicePixelRatio, document.body.clientHeight * window.devicePixelRatio);  
            game.scale.refresh();   
            game.state.start('boot', true, false);
         };
    }

    create() {

        this.init();

        this.game.input.maxPointers = 1;

        this.initGlobalVariables();

        this.game.state.start('preloader');
    }

    initGlobalVariables() {
        this.game.global = {
            interaction: 1,
            isComplete: false,
            canInteract: true
        };
    }
}

export default Boot;