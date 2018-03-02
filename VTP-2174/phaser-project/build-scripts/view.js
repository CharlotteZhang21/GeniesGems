var fs = require('fs');
var iecSettings = JSON.parse(fs.readFileSync('./iec-settings.json', 'utf8'));
var localisation = JSON.parse(fs.readFileSync('./localisation.json', 'utf8'));
var fileString = "";
var name, value;

for (var key in iecSettings) {
    if (iecSettings.hasOwnProperty(key)) {


        fileString += "PiecSettings." + key + " = "


        if (Array.isArray(iecSettings[key])) {


            value = iecSettings[key][0];


        } else {
            value = iecSettings[key];
        }

        if (Number.isInteger(value)) {
            fileString += value + ";\n";
        } else {
            fileString += "\"" + value + "\";\n";
        }

    }
}


var localKey = Object.keys(localisation)[0];
var localData = localisation[localKey];

localData.forEach(function(item) {
    name = Object.keys(item)[0];
    value = item[name];

    fileString += "LocalisationSettings." + name + " = \"" + value + "\";\n";
}, this);


fs.appendFile('./src/settings-overide.js', fileString, function(err) {

});
