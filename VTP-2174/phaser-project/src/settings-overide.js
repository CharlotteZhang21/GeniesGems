var PiecSettings = PiecSettings || {};

PiecSettings.env = 'dev';

var LocalisationSettings = LocalisationSettings || {};

window.addEventListener("load", function(event) {

    recurseDOM(document.body);


    var root = document.getElementsByTagName('html')[0]; // '0' to assign the first (and only `HTML` tag)

    root.setAttribute('class', LocalisationSettings['lang_code']);


}, false);


function recurseDOM(scope) {
    var i = 0,
        nodes, node;
    if (scope.childNodes) {
        nodes = scope.childNodes;
        for (i; i < nodes.length; i++) {
            node = nodes[i];
            if (node.nodeType === 3) {
                //is a text node


                var result;

                for (var key in LocalisationSettings) {
                    if (LocalisationSettings.hasOwnProperty(key)) {




                        result = checkTextNode(
                            node,
                            LocalisationSettings[key],
                            "\{\{" + key + "\}\}");

                    }
                }

            }
            if (node.childNodes) {
                //loop through child nodes if child nodes are found
                recurseDOM(node);
            }
            node = null;
        }
        nodes = null;
    }
}

function checkTextNode(node, regexVal, regexPattern) {

    var newText = regexVal,
        patt = new RegExp(regexPattern, "g"),
        text = node.data,
        test = patt.test(text);
    if (test) {
        //match found, replace node's textual data with specified string
        node.data = text.replace(patt, newText);
        newText = null;
        text = null;
    }
    test = null;
}
PiecSettings.level = 1;
LocalisationSettings.lang_code = "en";
LocalisationSettings.download = "DOWNLOAD";
LocalisationSettings.victory = "Victory";
LocalisationSettings.casualties = "Casualties";
LocalisationSettings.you_lose = "You lose";
LocalisationSettings.reinforcements = "REINFORCEMENTS";
LocalisationSettings.your_army = "Your army";
LocalisationSettings.demon_slayer = "Demon Slayer";
LocalisationSettings.info_1 = "You are losing the battle!";
LocalisationSettings.info_2 = "Quickly send for reinforcements before it is too late ";
