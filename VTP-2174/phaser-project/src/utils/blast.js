export function blast1(x, y) {

    return this.blast(x, y, 1);
}

export function blast2(x, y) {

    return this.blast(x, y, 2);
}

export function blast(x, y, radius) {

    var blast = [];

    for (var i = -1 * radius; i <= radius; i++) {

        for (var j = -1 * radius; j <= radius; j++) {

            blast.push({
                x: x + i,
                y: y + j,
                dist: Phaser.Math.distance(x, y, x + i, y + j)
            });
        }
    }

    return blast;
}

export function horizontal(x, y, w, h) {

    var blast = [];

    for (var i = 0; i < w; i++) {

        blast.push({
            x: i,
            y: y,
            dist: Phaser.Math.distance(x, y, i, y)
        });
    }

    return blast;
}

export function left(x, y, w, h) {

    var tempBlast = this.horizontal(x, y, w, h);

    var blast = [];

    for (var i = 0; i < tempBlast.length; i++) {

        if (tempBlast[i].x < x) {
            blast.push(tempBlast[i]);
        }
    }

    return blast;
}

export function right(x, y, w, h) {

    var tempBlast = this.horizontal(x, y, w, h);

    var blast = [];

    for (var i = 0; i < tempBlast.length; i++) {

        if (tempBlast[i].x > x) {
            blast.push(tempBlast[i]);
        }
    }

    return blast;
}

export function up(x, y, w, h) {

    var tempBlast = this.vertical(x, y, w, h);

    var blast = [];

    for (var i = 0; i < tempBlast.length; i++) {

        if (tempBlast[i].y < y) {
            blast.push(tempBlast[i]);
        }
    }

    return blast;
}

export function down(x, y, w, h) {

    var tempBlast = this.vertical(x, y, w, h);

    var blast = [];

    for (var i = 0; i < tempBlast.length; i++) {

        if (tempBlast[i].y > y) {
            blast.push(tempBlast[i]);
        }
    }

    return blast;
}

export function vertical(x, y, w, h) {

    var blast = [];

    for (var i = 0; i < w; i++) {

        blast.push({
            x: x,
            y: i,
            dist: Phaser.Math.distance(x, y, x, i)
        });
    }

    return blast;
}

export function horizontalAndVertical(x, y, w, h) {

    var blast = [];

    blast = blast.concat(this.horizontal(x, y, w, h));
    blast = blast.concat(this.vertical(x, y, w, h));

    return blast;
}