/*
 * PieChart
 *
 * Build Pie chart based on percentages
 *
 * myPie = Pie(ParentElement, data, options);
 *
 * Canvas takes size from ParentElement
 *
 * myPie.redraw() available to recalulate size
 *
 * Data must look like
 *
 *
 *          [
 *              {   
 *                  "label": "test 1",
 *                  "percentage": 0.3,
 *                  "hex": "#123456"
 *              },
 *               {  
 *                  "label": "test 2",
 *                  "percentage": 0.3,
 *                  "hex": "#654321"
 *              },
 *               {
 *                  "label": "test 3",
 *                  "percentage": 0.4,
 *                  "hex": "#ffaa11"
 *              }
 *          ]
 *
 *  options are optional
 *
 * options.thickness = 0.1 (default. Percentage of total radius to display)
 * options.offset = 1 (degrees. Size of gap between segments)
 */

define([], function() {
    var PieChart, pc, tests, toHex, clickHandler,
        edgeOrder = ['top', 'right', 'bottom', 'left'];

    PieChart = function(element, data, options) {

        this.element = element;
        this.procOptions(options);
        this.data = this.getConvertedData(data);

        this.initCanvas();
        this.draw();

        this.labels = data.map(function(item){
            return {
                key: item.hex,
                label: item.label
            }
        });

        clickHandler = this.handleClick.bind(this);
        this.canvas.addEventListener('click', clickHandler);
    };
    pc = PieChart.prototype;

    pc.handleClick = function(e) {
        var data = this.ctx.getImageData(e.x, e.y, 1, 1).data,
            hex = '#' + toHex(data[0]) + toHex(data[1]) + toHex(data[2]),
            result = this.getLabelFromKey(hex);
            
            if (result) {
                //trigger custom event, add result to event and pass through
                e.pieLabel = result;
                this.onLabelClicked(e);
            }
    };
    pc.onLabelClicked = function(e) {
        //Blank method. Overwrite with your own call back
    };
    pc.lowerCaseCompare = function(a, b) {
        return a.toLowerCase() === b.toLowerCase();
    };
    pc.getLabelFromKey = function(key) {
        var result = this.labels.filter(function(label) {
            return this.lowerCaseCompare(key, label.key)
        }.bind(this))
        result = result.length ? result[0].label : false;
        return result;
    };

    pc.procOptions = function(options) {
        options = options || {};
        this.options = {};
        this.options.thickness = options.thickness || 0.1;
        this.options.offset = options.offset || 1;
    };
    pc.draw = function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.addClipForAndroid.apply(this, this.getRingMaskRadii(this.options.thickness));

        this.data.forEach(function(data) {
            this.drawSegment.apply(this, data);
        }.bind(this));

        this.maskPath.apply(this, this.getRingMaskRadii(this.options.thickness));
    };
    pc.clearAndDraw = function() {
        this.initCanvas();
        this.draw();
    };
    pc.getRingMaskRadii = function(thickness) {
        var radius = (this.canvas.height > this.canvas.width ? this.canvas.width : this.canvas.height) / 2,
            thicknessRadius = radius * (1 - thickness);

        return [radius, thicknessRadius];
    };
    pc.getAngleFromPercentage = function(percentage) {
        return percentage * 360;
    };
    pc.getConvertedData = function(data) {
        var currentStartAngle = 0;
        return data
            .map(function(data) {
                var startAngle = currentStartAngle;
                var endAngle = startAngle + this.getAngleFromPercentage(data.percentage);
                currentStartAngle = endAngle;
                return [startAngle, endAngle, data.hex];
            }.bind(this))
            .map(function(data) {
                return [data[0] + (this.options.offset / 2), data[1] - (this.options.offset / 2), data[2]];
            }.bind(this));
    };
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
        }.bind(this));
    };
    pc.initCanvas = function() {
        var sizes = this.element.getBoundingClientRect()
            addedToCanvas = !!this.canvas;
        this.canvas = this.canvas || document.createElement('canvas');
        this.canvas.height = sizes.height;
        this.canvas.width = sizes.width;
        this.ctx = this.canvas.getContext('2d');
        addedToCanvas || this.element.appendChild(this.canvas);
    };
    pc.getCentre = function() {
        return [this.canvas.width / 2, this.canvas.height / 2];
    };
    pc.getOpposite = function(angle, adjacent) {
        var args = this.angleOffset(angle);
        args.unshift(adjacent);
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
    pc.drawLine = function(angle, color) {
        var endPoint = this.getEndOfLine(angle);
        this.ctx.beginPath();
        this.ctx.moveTo.apply(this.ctx, this.getCentre());
        this.ctx.lineTo.apply(this.ctx, endPoint);

        return {
            point: endPoint,
            edge: this.getEdge(angle)
        };
    };
    pc.addClipForAndroid = function(radius) {
        //fix for stock android browsers that do not support 'ctx.globalCompositeOperation = 'destination-in';'
        if (navigator.userAgent.match('Android') && navigator.userAgent.match('AppleWebKit')){
              this.ctx.beginPath();
              this.ctx.arc(this.getCentre()[0], this.getCentre()[1], radius, 0, Math.PI * 2, true);
              this.ctx.closePath();
              this.ctx.clip();
        }
    }
    pc.drawSegment = function(startAngle, endAngle, color) {
        var startLine, endLine,
            i = 0;
        startLine = this.drawLine(startAngle, color);
        endLine = this.drawLine(endAngle, color);

        

        while (startLine.edge !== endLine.edge) {
            endLine = this.gotoPreviousCorner(endLine);
        }
        this.ctx.lineTo.apply(this.ctx, startLine.point);
        this.ctx.fillStyle = color;
        this.ctx.fill();
    };
    pc.maskPath = function(radius, thickness) {
        

        this.ctx.beginPath();
        this.ctx.arc(this.getCentre()[0], this.getCentre()[1], radius, 0, Math.PI * 2, true);
        this.ctx.closePath();
        this.ctx.globalCompositeOperation = 'destination-in';
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(this.getCentre()[0], this.getCentre()[1], thickness, 0, Math.PI * 2, true);
        this.ctx.closePath();

        /// set composite mode
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.fill();

        /// reset composite mode to default
        this.ctx.globalCompositeOperation = 'source-over';
    };
    pc.gotoPreviousCorner = function(line) {
        var newEdgeIndex = (edgeOrder.indexOf(line.edge) || 4) - 1,
            xEdge = [line.edge, edgeOrder[newEdgeIndex]].filter(function(edge) { return edge === 'right' || edge === 'left'})[0],
            yEdge = [line.edge, edgeOrder[newEdgeIndex]].filter(function(edge) { return edge === 'top' || edge === 'bottom'})[0];


            cornerPoint = this.getCorner(xEdge, yEdge);

            this.ctx.lineTo.apply(this.ctx, cornerPoint);

            line.edge = edgeOrder[newEdgeIndex];
            line.point = cornerPoint;


        return line;
    };
    tests = function(element, data) {
        var result = true;

            if (! element instanceof Element) {
                throw new TypeError('first argument of Pie must be a DOM element');
                result = false;
            }
            if (data.filter(function(elem) { return (typeof elem.percentage !== 'number' || typeof elem.hex !== 'string') || typeof elem.label !== 'string');}).length) {
                throw new TypeError('Pie Data invalid, must be an array of objects -> [{label: "string", hex: "string", percentage: number}]');
                result = false;
            }
            if (data.reduce(function(previousValue, currentValue, index, array) {return previousValue + currentValue.percentage;},0) > 1) {
                throw new RangeError('Sum value of data percentages must not exceed 1');
                result = false;
            }

        return result;
    };
    toHex = function(val) {
        return ("0" + parseInt(val).toString(16)).slice(-2);
    };

    return function(element, data, options) {
        if (tests.apply(this, arguments)) {
            var Pie = new PieChart(element, data, options);
            Pie.redraw = Pie.clearAndDraw.bind(Pie); //alias for external use
            return Pie;
        }

    }

});
