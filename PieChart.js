/*
 * PieChart
 *
 * Build Pie chart based on percentages
 *
 * Pie(ParentElement, data);
 *
 * Canvas takes size from ParentElement
 *
 * Data must look like
 *
 *
 *          [
 *              {
 *                  "percentage": 30,
 *                  "hex": "#123456"
 *              },
 *               {
 *                  "percentage": 30,
 *                  "hex": "#654321"
 *              },
 *               {
 *                  "percentage": 40,
 *                  "hex": "#ffaa11"
 *              }
 *          ]
 */

define([], function() {
    var PieChart, pc, tests,
        edgeOrder = ['top', 'right', 'bottom', 'left'];

    PieChart = function(element, data) {
        this.initCanvas(element);
        this.drawSegment(0, 120, '#123456');
        this.drawSegment(120, 200, '#FFF456');
        this.drawSegment(200, 0, '#123FFF');

        

    };
    pc = PieChart.prototype;

    pc.getCorner = function(edge1, edge2) {
        return [edge1, edge2].splice(0, 2).map(function(edge) {
            switch (edge) {
                case 'top':
                    return 0;
                case 'right':
                    return this.canvas.width;
                case 'bottom':
                    return this.canvas.height;
                case 'left':
                    return 0;
            }
        }.bind(this))
    }

    pc.initCanvas = function(element) {
        var sizes = element.getBoundingClientRect();
        this.canvas = document.createElement('canvas');
        this.canvas.height = sizes.height;
        this.canvas.width = sizes.width;
        element.appendChild(this.canvas);
    };
    pc.getCentre = function(){
        return [this.canvas.width / 2, this.canvas.height / 2];
    };
    pc.getOpposite = function(angle, adjacent) {
        var args = this.angleOffset(angle);
        args.unshift(adjacent)
        return this.getLength.apply(this, args);
    };
    pc.getLength = function(adjacent, angle, inverted) {
        length = adjacent * (Math.tan(angle * Math.PI / 180));
        return inverted ? 0 - length : length;
    };
    pc.getEndOfLine = function(angle) {
        var edge = this.getEdge(angle);



        switch (edge) {
            case 'top' :
                return [this.getCentre()[0] + this.getOpposite(angle, this.getCentre()[1]), 0];
            case 'right' :
                return [this.canvas.width, this.getCentre()[1] + this.getOpposite(angle, this.getCentre()[0])];
            case 'bottom' :
                return [this.getCentre()[0] - this.getOpposite(angle, this.getCentre()[1]), this.canvas.height];
            case 'left' :
                return [0, this.getCentre()[1] - this.getOpposite(angle, this.getCentre()[0])];
        }



    };


    pc.angleOffset = function(angle) {
        if (angle % 90 >= 45) {
            angle = 90 - (angle % 90);
            inv = true;
        } else {
            angle = (angle % 90);
            inv = false;
        }
        return [angle, inv];
    };
    pc.getEdge = function(angle) {
        var quadrant = Math.floor(angle / 45);
        switch (quadrant) {
            case 0 : return 'top'; case 7 : return 'top';
            case 1 : return 'right'; case 2 : return 'right';
            case 3 : return 'bottom'; case 4 : return 'bottom';
            case 5 : return 'left'; case 6 : return 'left';
        }
    };
    pc.drawLine = function(segment, angle, color) {
        var endPoint = this.getEndOfLine(angle);
        segment.beginPath();
        segment.moveTo.apply(segment, this.getCentre());
        segment.lineTo.apply(segment, endPoint);
        segment.strokeStyle = color;
        segment.stroke();
        
        return {
            point: endPoint,
            edge: this.getEdge(angle),
            segment: segment
        };
    };
    pc.drawSegment = function(startAngle, endAngle, color) {
       


        var startLine, endLine,
            segment = this.canvas.getContext('2d'), i = 0;


        

        // segment.arc(this.getCentre()[0], this.getCentre()[1],this.canvas.height/2 - 20,0,Math.PI*2,true);
        // segment.globalCompositeOperation = "destination-out";
        // segment.clip();

        startLine = this.drawLine(segment, startAngle, color);
        endLine = this.drawLine(segment, endAngle, color);


        
        while (startLine.edge !== endLine.edge) {
            endLine = this.gotoPreviousCorner(endLine);
        }
        segment.lineTo.apply(segment, startLine.point);
        segment.fillStyle = color;
        segment.fill();

        segment.beginPath();
        segment.arc(this.getCentre()[0], this.getCentre()[1],this.canvas.height / 2 - 20, 0, Math.PI * 2, true);
        segment.closePath();

        /// set composite mode
        segment.globalCompositeOperation = 'destination-out';
        segment.fill();

        segment.arc(this.getCentre()[0], this.getCentre()[1],this.canvas.height/2,0,Math.PI*2,true);
        segment.globalCompositeOperation = 'destination-in';
        segment.fill();

        /// reset composite mode to default
        segment.globalCompositeOperation = 'source-over';

        
        // segment.restore()




        

    };
    pc.gotoPreviousCorner = function(line) {
        var newEdgeIndex = (edgeOrder.indexOf(line.edge) || 4) - 1,
            xEdge = [line.edge, edgeOrder[newEdgeIndex]].filter(function(edge) { return edge === 'right' || edge === 'left'})[0],
            yEdge = [line.edge, edgeOrder[newEdgeIndex]].filter(function(edge) { return edge === 'top' || edge === 'bottom'})[0];


            cornerPoint = this.getCorner(xEdge, yEdge);

            line.segment.lineTo.apply(line.segment, cornerPoint);

            line.edge = edgeOrder[newEdgeIndex];
            line.point = cornerPoint;


        return line;
    }





    tests = function(element, data) {
        var result = true;

            if (! element instanceof Element) {
                throw new TypeError('first argument of Pie must be a DOM element');
                result = false;
            }
            if (data.filter(function(elem) { return (typeof elem.percentage !== 'number' || typeof elem.hex !== 'string');}).length) {
                throw new TypeError('Pie Data invalid, must be an array of objects -> [{hex: "string", percentage: number}]');
                result = false;
            }
            if (data.reduce(function(previousValue, currentValue, index, array) {return previousValue + currentValue.percentage;},0) > 100) {
                throw new RangeError('Sum value of data percentages must not exceed 100');
                result = false;
            }

        return result;
    };

    return function(element, data) {
        if (tests.apply(this, arguments)) {
            var Pie = new PieChart(element, data);
            return Pie;
        }

    }

});
