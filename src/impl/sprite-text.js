import CanvasSprite from '../misc/canvassprite';
import * as PIXI from 'pixi.js';
/**
 * @callback Sprite~eventCallback
 * @this {Sprite}
 */

/**
 * @block {command} text ()# options ()# for () secs# then call ()
 * @param {String} ["Hello!"] text
 * @param (optional) {Object} [{}] options
 * @param (optional) {Number} [2] seconds
 * @param (optional) {Sprite~eventCallback} fn
 * @returns {*}
 */
export function text(text, options, seconds) {
    if (seconds) {
        return this.promise(function (resolve, reject) {
            _text.call(this, text, options, seconds, resolve);
        });
    } else {
        _text.call(this, text, options);
        return Promise.resolve();
    }

};

function _text(text, options, seconds, fn) {
    var type = options && options.type || 'balloon';

    if (this._textUpdater) {
        this._textUpdater.unbind();
        delete this._textUpdater;
    }
    if (this._textBox) {
        this._textBox.visible = false;
    }
    if (!text || text === "") {
        this.stage._stageContainer.removeChild(this._textBox);
        delete this._textBox;
        return;
    }
    var sprite = this;

    if (!this._textBox) {
        this._textBox = new PIXI.Container();
        this._textBox.addChild(CanvasSprite.create(500, 500));
        this._textBox.addChild(CanvasSprite.create(500, 500));
        if (this.stage) {
            this.stage._textContainer.addChild(this._textBox);
        }
    }
    this._textBox.visible = true;
    this._textBox.x = 0;
    this._textBox.y = 0;
    var lsn = this._textBox.getChildAt(0);
    updateTextCanvasSprite.call(this, lsn, text, type, false);
    var lsf = this._textBox.getChildAt(1);
    updateTextCanvasSprite.call(this, lsf, text, type, true);
    lsn.visible = true;
    lsf.visible = false;

    this._textUpdater = new TextUpdater(this, seconds, fn);
};

var TextUpdater = function(sprite, duration, callback) {
    var self = this;
    this.done = false;
    this._unbind = false;

    if (duration) {
        this.endTime = new Date().getTime() + duration * 1000;
    } else {
        // No duration will always return true for isDone()
        this.done = true;
    }

    this.unbind = function() {
        self._unbind = true;
    };

    this.doCallback = function() {
        if (callback) {
            window.setTimeout(function() {
                callback.call(sprite);
            }, 0);
        }
    };

    this.update = function() {
        if (self._unbind) {
            this.stop();
            this.doCallback();
            return false;
        }
        if (this.endTime && this.endTime < new Date().getTime()) {
            this.stop();
            sprite._textBox.visible = false;
            this.doCallback();
            return false;
        }
        let screen = sprite.stage._app.screen;
        let lsn = sprite._textBox.getChildAt(0);
        let lsf = sprite._textBox.getChildAt(1);
        let boundsTextBox = sprite._textBox.getBounds(false);
        let boundsSprite = sprite._pixiObject.getBounds(false);
        // Check if there is enough room for the textbox
        let canBeRight = boundsSprite.right + boundsTextBox.width / 2 < screen.right;
        let canBeLeft = boundsSprite.left - boundsTextBox.width / 2 > screen.left;
        let pos;
        let ls;
        // lsn.x = sprite.width * 0.25;
        // lsf.x = -sprite.width * 0.25 - lsf.width;

        if (!lsn.visible && !lsf.visible) {
            lsn.visible = true;
        }
        if (lsn.visible && !canBeRight) {
            lsn.visible = false;
            lsf.visible = true;
        } else if (!canBeLeft) {
            lsn.visible = true;
            lsf.visible = false;
        }
        let y = boundsSprite.top - boundsTextBox.height;

        if (y < screen.top) {
            y = screen.top;
        }
        if (y + boundsTextBox.height > screen.bottom) {
            y = screen.bottom - boundsTextBox.height;
        }
        if (lsn.visible) {
            pos = new PIXI.Point(boundsSprite.right - boundsSprite.width*0.25, y);
            ls = lsn;
        } else {
            pos = new PIXI.Point(boundsSprite.left - boundsTextBox.width*0.75, y);
            ls = lsf;
        }

        let locPos = sprite.stage._stageContainer.toLocal(pos);
        sprite._textBox.x = locPos.x;
        sprite._textBox.y = locPos.y;
    };

    this.stop = function() {
        self.done = true;
    };
    this.isDone = function() {
        return self.done;
    };
    sprite.on("frame", function() {
        return self.update();
    });
    this.update();
};

var breakWord = function(c, word, maxWidth) {
    var words = [];
    var w = word;
    while (c.measureText(w).width > maxWidth) {
        for ( var i = w.length; i >= 0; i--) {
            if (c.measureText(w.substring(0, i)).width < maxWidth) {
                words.push(w.substring(0, i));
                w = w.substring(i);
                break;
            }
        }
    }
    words.push(w);
    return words;
};

var wrapText = function(c, text, maxWidth) {
    var words = [];
    text.split(' ').forEach(function(word) {
        words = words.concat(breakWord(c, word, maxWidth));
    });
    var lines = [];
    var line = '';
    for ( var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + ' ';
        var testWidth = c.measureText(testLine).width;
        if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);
    return lines;
};

var updateTextCanvasSprite = function(canvasSprite, text, type, flip) {
    var font = this._options.font || "16px Arial";
    var lineHeight = parseInt(font);
    if (!lineHeight || isNaN(lineHeight)) {
        lineHeight = 16;
    } else {
        lineHeight *= 1.2;
    }
    var fontFillStyle = this._options.fontFillStyle || "black";
    var balloonFillStyle = this._options.balloonFillStyle || "white";
    var balloonLineStyle = this._options.balloonStrokeStyle || "black";
    var balloonLineWidth = this._options.balloonStrokeWidth || 3;
    var balloonWidth = this._options.balloonWidth || 200;

    var canvas = canvasSprite.canvas;
    var c = canvas.getContext("2d");

    c.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = balloonWidth;
    c.font = font;
    c.textBaseline = "top";
    var textWidth = c.measureText(text).width;
    if (textWidth < 50) {
        textWidth = 50;
    }
    var lines = [ text ];
    if (textWidth > balloonWidth) {
        textWidth = balloonWidth;
        lines = wrapText(c, text, textWidth);
    }
    var textHeight = lines.length * lineHeight - 0.3 * lineHeight;
    var m = balloonLineWidth / 2 + 2;
    var w = textWidth + 20 + 2 * m;
    var h = textHeight + 40 + 2 * m;
    canvas.width = w;
    canvas.height = h;
    c.fillStyle = balloonFillStyle;
    c.lineStyle = balloonLineStyle;
    c.lineCap = 'round';
    c.lineWidth = balloonLineWidth;
    c.beginPath();
    var ellipse = function(x1, y1, x2, y2) {
        var xm = (x1 + x2) / 2;
        var ym = (y1 + y2) / 2;
        c.beginPath();
        c.moveTo(x1, ym);
        c.quadraticCurveTo(x1, y1, xm, y1);
        c.quadraticCurveTo(x2, y1, x2, ym);
        c.quadraticCurveTo(x2, y2, xm, y2);
        c.quadraticCurveTo(x1, y2, x1, ym);
        c.stroke();
        c.fill();
    };

    if (type === "balloon") {
        if (!flip) {
            c.moveTo(10 + m, h - m);
            c.lineTo(20 + m, h - 20 - m);
        } else {
            c.moveTo(w - 10 - m, h - m);
            c.lineTo(w - 50 - m, h - 20 - m);
        }
    } else {
        if (!flip) {
            ellipse(10 + m, h - m, 16 + m, h - 4 - m);
            ellipse(20 + m, h - 5 - m, 30 + m, h - 10 - m);
            ellipse(34 + m, h - 10 - m, 46 + m, h - 16 - m);
            c.beginPath();
        } else {
            ellipse(w - 10 - m, h - m, w - 16 - m, h - 4 - m);
            ellipse(w - 20 - m, h - 5 - m, w - 30 - m, h - 10 - m);
            ellipse(w - 34 - m, h - 10 - m, w - 46 - m, h - 16 - m);
            c.beginPath();

        }
        c.moveTo(10 + m, h - 20 - m);
    }
    c.lineTo(10 + m, h - 20 - m);
    c.quadraticCurveTo(m, h - 20 - m, m, h - 30 - m);
    c.lineTo(m, 10 + m);
    c.quadraticCurveTo(m, m, 10 + m, m);
    c.lineTo(w - 10 - m, m);
    c.quadraticCurveTo(w - m, m, w - m, 10 + m);
    c.lineTo(w - m, h - 30 - m);
    c.quadraticCurveTo(w - m, h - 20 - m, w - 10 - m, h - 20 - m);
    if (type === "balloon") {
        if (!flip) {
            c.lineTo(50 + m, h - 20 - m);
            c.lineTo(10 + m, h - m);
        } else {
            c.lineTo(w - 20 - m, h - 20 - m);
            c.lineTo(w - 10 - m, h - m);
        }
    } else {
        c.lineTo(10 + m, h - 20 - m);
    }
    c.fill();
    c.stroke();

    c.fillStyle = fontFillStyle;
    c.font = font;
    c.textBaseline = "top";
    for ( var i = 0; i < lines.length; i++) {
        var tw = c.measureText(lines[i]).width;
        c.fillText(lines[i], w / 2 - tw / 2, 10 + i * lineHeight);
    }

    canvasSprite.setCanvasChanged();
};
