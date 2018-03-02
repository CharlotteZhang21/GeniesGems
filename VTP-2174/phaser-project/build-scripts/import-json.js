var glob = require('glob');
var fs = require('fs');

var fileName;

if (process.argv.length !== 4) {
    console.log('usage:');
    console.log('node import-json.js regex path');
    console.log(' ');
    console.log('(where regex is the glob pattern to find files)');
    console.log('(where path is the destination output path)');
    console.log(' ');
    console.log('example:');
    console.log('node import-json.js \'./atlas/*.json\' \'./src/const/\'');
    console.log(' ');

    return;
}

var find = process.argv[2];
var output = process.argv[3];
var atlasStr1 = '';
var atlasStr2 = '\nexport default {';
var atlasName;
var atlasParamName;

glob(find, function(er, files) {

    files.forEach(function(f, index) {

        var data = fs.readFileSync(f, 'utf8');

        fileName = f.substring(f.lastIndexOf('/') + 1, f.length - 2);

        atlasName = fileName.substring(0, fileName.length - 3);

        atlasParamName = atlasName
            .replace(new RegExp('-', 'g'), '')
            .replace(new RegExp('_', 'g'), '')
            .replace(new RegExp(' ', 'g'), '');

        data = 'export default ' + data;

        console.log('successfully imported ' + output + fileName);

        fs.writeFile(output + fileName, data, function(err) {
            if (err) throw err;
        });

        atlasStr1 += 'import * as ' + atlasParamName + ' from \'./' + fileName + '\';\n';
        atlasStr2 += '\n"' + atlasName + '": ' + atlasParamName + '.default';

        if (index < files.length - 1) {
            atlasStr2 += ', ';
        }

    }, this);

    atlasStr2 += '\n};'

    fs.writeFile(output + 'index.js', atlasStr1 + atlasStr2, function(err) {
        if (err) throw err;
    });
});
