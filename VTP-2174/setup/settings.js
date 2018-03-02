/********************* GENERAL *********************/

exports.autoPlayAfter = 6000; // milliseconds

// todo implement tap
exports.interactionType = 'swipe'; // swipe or tap

exports.fallUpwards = false; // direction of fall 

exports.fallStyle = 'bounce'; // bounce or elastic

exports.tileBounce = 0.5; // number between 0 and 1

exports.gravity = 1; // gravity strength

exports.piecePadding = '15%'; // padding around the pieces on the board

exports.belowPiecePadding = '-10%'; // padding around the pieces under the board

exports.fadeBoardOnComplete = false; // when all interactions are complete the game board will fade in/out

exports.removeGoalPanelOnComplete = true; // when all interactions are complete the goal panel will move out/stay

exports.timer = false; // hide close button until interaction/autoplay

exports.timerDuration = 1000; // time until close button will appear after first interaction

exports.interactionDelay = 0; // delay between tooltip hide and actual board interaction

exports.handAnchorX = 0; // the x anchor point of the tutorial hand (usually a number between 0 and 1)

exports.handAnchorY = 0; // the y anchor point of the tutorial hand (usually a number between 0 and 1)

exports.lang = 'en'; // the current language of the end card

// exports.settingsOveride = '4s_Timer';

/********************* INTERACTIONS *********************/

exports.interaction1 = {
    highlightTiles: [{ x: 3, y: 4 }, { x: 3, y: 3 }], // tiles to highlight
    arrow: { dir: 'left' }, // arrow direction
    tooltip: '{{tooltip1}}' // tooltip text
};

exports.interaction2 = {
    highlightTiles: [{ x: 3, y: 7 }, { x: 4, y: 7 }], // tiles to highlight
    arrow: { dir: 'left' }, // arrow direction
    tooltip: '{{tooltip2}}' // tooltip text
};

exports.interaction3 = {
    highlightTiles: [{ x: 6, y: 5 }, { x: 7, y: 5 }], // tiles to highlight
    arrow: { dir: 'left' }, // arrow direction
    tooltip: '{{tooltip2}}' // tooltip text
};

// tooltip text colors
exports.tooltipTextFill = '#884444';
exports.tooltipTextStroke = '#000000';
exports.tooltipTextStrokeThickness = 0;

/********************* GOALS (OPTIONAL) *********************/

// exports.goal1 = {
//     item: 'collectable01', // this should match name in setup/pieces directory
//     amount: 2 // the amount to collect
// };

// exports.goal2 = {
//     item: 'piece04', // this should match name in setup/pieces directory
//     amount: 10 // the amount to collect
// };

// exports.goal3 = {
//     item: 'piece03', // this should match name in setup/pieces directory
//     amount: 10 // the amount to collect
// };

// goal text colors
exports.goalTextFill = '#ffffff';
exports.goalTextStroke = '#000000';
exports.goalTextStrokeThickness = 6;

// goal panel config
exports.goalPanelExitPortrait = 'up';
exports.goalPanelExitLandscape = 'up';
exports.goalPanelAnglePortrait = 0;
exports.goalPanelAngleLandscape = 0;

/********************* BOOSTERS (optional) *********************/

exports.booster01 = {
    name: 'boster01', // boster name
    destroys: 'blast1', // choose from: horizontal, vertical, horizontalAndVertical, blast1, blast2
    delay: 300, // the delay before tiles fall
    piecesToCreate: '4-horizontal' // choose from: 4-horizontal, 4-vertical, mixture, 5-in-a-line
};

exports.booster02 = {
    name: 'bomb', // boster name
    destroys: 'blast2', // choose from: horizontal, vertical, horizontalAndVertical, blast1, blast2
    delay: 300, // the delay before tiles fall
    piecesToCreate: 'mixture' // choose from: 4-horizontal, 4-vertical, mixture, 5-in-a-line
};

exports.fox = {
    startX: 5,
    startY: 4, //starting from (0,4) of the board
    animation:{
        idle: 'fox-idle',
        jump: 'fox-jump',
        succeed: 'fox-succeed'
    },
    moveDuration: 1000
}

/********************* ON USER WINS *********************/

exports.goalExitDelay = 0; // delay before the goal panel exits
exports.goalExitDuration = 600; // duration of goal panel moving

exports.ctaMoveDelay = 0; // delay before the cta moves
exports.ctaMoveDuration = 800; // duration of the cta moving

exports.ctaAnimation = 'bulge'; // choose from: bulge
exports.ctaAnimationDelay = 0; // delay for animation to start
exports.ctaAnimationDuration = 1000; // animation duration

exports.logoAnimation = 'spinIn'; // choose from: spinIn
exports.logoAnimationDelay = 0; // delay for animation to start
exports.logoAnimationDuration = 1000; // animation duration

/********************* CUSTOM EFFECTS (optional) *********************/

// POSSIBLE EASINGS
// Linear, BackIn, BackOut, BounceIn, BounceOut, CircularIn, CircularOut, CubicIn, CubicOut, ElasticIn, ElasticOut, ExponentialIn, ExponentialOut, QuadraticIn, QuadraticOut, QuarticIn, QuarticOut, QuinticIn, QuinticOut, SinusoidalIn, SinusoidalOut

var customEffects = {};

customEffects['ostin'] = { // name should either match directory in setup/animations or an image in assets
    fps: 10,
    loop: true,
    delay: 0,
    htmlId: 'ostin', // the id in the html where this will be placed (note also accepts an array)
    showOn: 'win', // should this show at startup
    animations: [{ // move this item when user wins
        y: '-100%',
        easing: 'QuadraticOut', // see possible easings (above)
        delay: 0,
        duration: 1000,
        animation: 'moveTo'
    }]
};

customEffects['cascade'] = { // name should either match directory in setup/animations or an image in assets
    fps: 60,
    loop: true,
    delay: 0,
    htmlId: ['cascade-1', 'cascade-2', 'cascade-3', 'cascade-4'], // the id in the html where this will be placed (note also accepts an array)
    showOn: 'win', // move this item at the begining
    animations: [{ // move this item when user wins
        easing: 'QuadraticOut', // see possible easings (above)
        delay: 0,
        duration: 500,
        animation: 'fadeIn'
    }]
};

customEffects['logo'] = { // name should either match directory in setup/animations or an image in assets
    fps: 60,
    loop: true,
    delay: 0,
    htmlId: 'logo', // the id in the html where this will be placed (note also accepts an array)
    showOn: 'win', // move this item at the begining
    animations: [{ // move this item when user wins
        easing: 'QuadraticOut', // see possible easings (above)
        delay: 0,
        duration: 1000,
        animation: 'spinIn'
    }]
};

exports.customEffects = customEffects;

/********************* ANIMATIONS *********************/

var animations = {};

animations['piece01-destroy'] = {
    fps: 30,
    scale: .5
};

animations['piece02-destroy'] = {
    fps: 30,
    scale: .5
};

animations['piece03-destroy'] = {
    fps: 30,
    scale: .5
};

animations['piece04-destroy'] = {
    fps: 30,
    scale: .5
};

animations['piece05-destroy'] = {
    fps: 30,
    loop: false,
    scale: .5
};

animations['booster01-destroy'] = {
    fps: 30,
    scale: 1.5
};

animations['booster02-destroy'] = {
    fps: 30,
    scale: 1
};

animations['fox-idle'] = {
    fps: 30,
    scale: 1.2
};

animations['fox-destroy'] = {
    fps: 30,
    scale: .24
};

// todo: 
// use this when you dont have a specific destroy animation for each tile
// animations['default-destroy'] = {
//  fps: 30,
//  loop: false
// };

exports.animations = animations;