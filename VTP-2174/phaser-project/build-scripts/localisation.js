var fs = require('fs');
var localisation = JSON.parse(fs.readFileSync('./localisation.json', 'utf8'));
const replace = require('replace-in-file');
var name, value, token, replaceText, replaceValue;

var options = {

    //Glob(s) 
    files: [
        '*.html'
    ]

};

for (var key in localisation) {
    if (localisation.hasOwnProperty(key)) {

        replaceText = [];
        replaceValue = [];

        localisation[key].forEach(function(item, i) {

            name = Object.keys(item)[0];
            token = "\{\{" + Object.keys(item)[0] + "\}\}";
            value = item[name];

            // console.log(name);
            // console.log(value);
            // console.log(token);

            replaceText.push(new RegExp(token, "g"));
            replaceValue.push(value);



        }, this);

        console.log(replaceText);
        console.log(replaceValue);

        options.replace = replaceText;
        options.with = replaceValue;


        replace(options)
            .then(function(changedFiles){
                console.log('Modified files:', changedFiles.join(', '));
            })
            .catch(function(error){
                console.error('Error occurred:', error);
            });
    }
}




// console.log(localisation);
