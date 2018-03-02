const exec = require('child_process').exec;
const fs = require('fs');
const execSync = require('child_process').execSync;
const glob = require('glob');
const _ = require('underscore');

const spriteSheetDir = './spritesheets/';
const assetsDir = './assets/';
const atlasDir = './atlas/';


glob(spriteSheetDir + '**/*.png', function(er, files) {

    var dirs = Object.keys(_.groupBy(files, function(f) {
        return f.substring(0, f.lastIndexOf('/')).replace(spriteSheetDir, '');
    }));

    var data, sheet, src, str, atlasData;

    for (var i = 0; i < dirs.length; i++) {

        data = atlasDir + dirs[i] + '.json';
        sheet = assetsDir + dirs[i] + '.png';
        src = spriteSheetDir + dirs[i];

        console.log('importing spritesheet ' + dirs[i]);

        execSync('/Applications/TexturePacker.app/Contents/MacOS/TexturePacker --format phaser-json-hash --data {DATA_FILE} --sheet {SHEET} {SRC}'
            .replace('{DATA_FILE}', data)
            .replace('{SHEET}', sheet)
            .replace('{SRC}', src));

        atlasData = JSON.parse(fs.readFileSync(data, 'utf8'));

        delete atlasData.meta.smartupdate;

        fs.writeFileSync(data, JSON.stringify(atlasData, null, 2));
    }

    console.log('\nimported all successfully!\n');
});