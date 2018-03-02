class CustomEase {


    //initialization code in the constructor
    constructor(sprite, data, config) {

        this.numbersExp = /(?:(-|-=|\+=)?\d*\.?\d*(?:e[\-+]?\d+)?)[0-9]/ig;
        this.svgPathExp = /[achlmqstvz]|(-?\d*\.?\d*(?:e[\-+]?\d+)?)[0-9]/ig;
        this.scientific = /[\+\-]?\d*\.?\d+e[\+\-]?\d+/ig;
        this.needsParsingExp = /[cLlsS]/g;
        this.bezierError = "CustomEase only accepts Cubic Bezier data.";
        this.calcEnd = true;

        this.setData(data, config);
    }

    Ease(p) {

        var point = this.lookup[(p * this.l) | 0] || this.lookup[this.l - 1];

        if (point.nx < p) {
            point = point.n;
        }

        return point.y + ((p - point.x) / point.cx) * point.cy;
    }

    setData(data, config) {

        data = data || "0,0,1,1";

        var values = data.match(this.numbersExp),
            closest = 1,
            points = [],
            l, a1, a2, i, inc, j, point, prevPoint, p, precision;
        config = config || {};
        precision = config.precision || 1;
        this.data = data;
        this.lookup = [];
        this.points = points;
        this.fast = (precision <= 1);
        if (this.needsParsingExp.test(data) || (data.indexOf("M") !== -1 && data.indexOf("C") === -1)) {
            values = this.pathDataToBezier(data);
        }
        l = values.length;
        if (l === 4) {
            values.unshift(0, 0);
            values.push(1, 1);
            l = 8;
        } else if ((l - 2) % 6) {
            throw this.bezierError;
        }
        if (+values[0] !== 0 || +values[l - 2] !== 1) {
            this.normalize(values, config.height, config.originY);
        }

        this.rawBezier = values;

        for (i = 2; i < l; i += 6) {
            a1 = { x: +values[i - 2], y: +values[i - 1] };
            a2 = { x: +values[i + 4], y: +values[i + 5] };
            points.push(a1, a2);
            this.bezierToPoints(a1.x, a1.y, +values[i], +values[i + 1], +values[i + 2], +values[i + 3], a2.x, a2.y, 1 / (precision * 200000), points, points.length - 1);
        }
        l = points.length;
        for (i = 0; i < l; i++) {
            point = points[i];
            prevPoint = points[i - 1] || point;
            if (point.x > prevPoint.x || (prevPoint.y !== point.y && prevPoint.x === point.x) || point === prevPoint) { //if a point goes BACKWARD in time or is a duplicate, just drop it.
                prevPoint.cx = point.x - prevPoint.x; //change in x between this point and the next point (performance optimization)
                prevPoint.cy = point.y - prevPoint.y;
                prevPoint.n = point;
                prevPoint.nx = point.x; //next point's x value (performance optimization, making lookups faster in getRatio()). Remember, the lookup will always land on a spot where it's either this point or the very next one (never beyond that)
                if (this.fast && i > 1 && Math.abs(prevPoint.cy / prevPoint.cx - points[i - 2].cy / points[i - 2].cx) > 2) { //if there's a sudden change in direction, prioritize accuracy over speed. Like a bounce ease - you don't want to risk the sampling chunks landing on each side of the bounce anchor and having it clipped off.
                    this.fast = false;
                }
                if (prevPoint.cx < closest) {
                    if (!prevPoint.cx) {
                        prevPoint.cx = 0.001; //avoids math problems in getRatio() (dividing by zero)
                        if (i === l - 1) { //in case the final segment goes vertical RIGHT at the end, make sure we end at the end.
                            prevPoint.x -= 0.001;
                            closest = Math.min(closest, 0.001);
                            this.fast = false;
                        }
                    } else {
                        closest = prevPoint.cx;
                    }
                }
            } else {
                points.splice(i--, 1);
                l--;
            }
        }
        l = (1 / closest + 1) | 0;
        this.l = l; //record for speed optimization
        inc = 1 / l;
        j = 0;
        point = points[0];
        if (this.fast) {
            for (i = 0; i < l; i++) { //for fastest lookups, we just sample along the path at equal x (time) distance. Uses more memory and is slightly less accurate for anchors that don't land on the sampling points, but for the vast majority of eases it's excellent (and fast).
                p = i * inc;
                if (point.nx < p) {
                    point = points[++j];
                }
                a1 = point.y + ((p - point.x) / point.cx) * point.cy;
                this.lookup[i] = { x: p, cx: inc, y: a1, cy: 0, nx: 9 };
                if (i) {
                    this.lookup[i - 1].cy = a1 - this.lookup[i - 1].y;
                }
            }
            this.lookup[l - 1].cy = points[points.length - 1].y - a1;
        } else { //this option is more accurate, ensuring that EVERY anchor is hit perfectly. Clipping across a bounce, for example, would never happen.
            for (i = 0; i < l; i++) { //build a lookup table based on the smallest distance so that we can instantly find the appropriate point (well, it'll either be that point or the very next one). We'll look up based on the linear progress. So it's it's 0.5 and the lookup table has 100 elements, it'd be like lookup[Math.floor(0.5 * 100)]
                if (point.nx < i * inc) {
                    point = points[++j];
                }
                this.lookup[i] = point;
            }

            if (j < points.length - 1) {
                this.lookup[i - 1] = points[points.length - 2];
            }
        }
        this.calcEnd = (points[points.length - 1].y !== 1 || points[0].y !== 0); //ensures that we don't run into floating point errors. As long as we're starting at 0 and ending at 1, tell GSAP to skip the final calculation and use 0/1 as the factor.

        return this;
    }

    bezierToPoints(x1, y1, x2, y2, x3, y3, x4, y4, threshold, points, index) {
        var x12 = (x1 + x2) / 2,
            y12 = (y1 + y2) / 2,
            x23 = (x2 + x3) / 2,
            y23 = (y2 + y3) / 2,
            x34 = (x3 + x4) / 2,
            y34 = (y3 + y4) / 2,
            x123 = (x12 + x23) / 2,
            y123 = (y12 + y23) / 2,
            x234 = (x23 + x34) / 2,
            y234 = (y23 + y34) / 2,
            x1234 = (x123 + x234) / 2,
            y1234 = (y123 + y234) / 2,
            dx = x4 - x1,
            dy = y4 - y1,
            d2 = Math.abs((x2 - x4) * dy - (y2 - y4) * dx),
            d3 = Math.abs((x3 - x4) * dy - (y3 - y4) * dx),
            length;
        if (!points) {
            points = [{ x: x1, y: y1 }, { x: x4, y: y4 }];
            index = 1;
        }
        points.splice(index || points.length - 1, 0, { x: x1234, y: y1234 });
        if ((d2 + d3) * (d2 + d3) > threshold * (dx * dx + dy * dy)) {
            length = points.length;
            this.bezierToPoints(x1, y1, x12, y12, x123, y123, x1234, y1234, threshold, points, index);
            this.bezierToPoints(x1234, y1234, x234, y234, x34, y34, x4, y4, threshold, points, index + 1 + (points.length - length));
        }
        return points;
    }
}

export default CustomEase;
