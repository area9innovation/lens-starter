var screenfull = require('screenfull');

var Fullscreen = function () {
    var fullscreenElement = null,
        isFullscreen = screenfull.enabled ? screenfull.isFullscreen : false;

    var onFullscreenOn = function (el) {
        el.classList.add('full-screen');
        fullscreenElement = el;
        isFullscreen = true;
    };

    var onFullscreenOff = function (el) {
        el.classList.remove('full-screen');
        fullscreenElement = null;
        isFullscreen = false;
    };

    return {
        enabled: function () { return true; },
        isFullscreen: function () { return isFullscreen; },
        request: function (el) {
            if (screenfull.enabled) 
                return screenfull.request(el).then(function () { onFullscreenOn(el); });

            document.body.classList.add('full-screen-pseudo');
            onFullscreenOn(el);

            return Promise.resolve();
        },
        exit: function (el) {
            el = el || fullscreenElement;

            if (screenfull.enabled) 
                return screenfull.exit(el).then(function () { onFullscreenOff(el); });

            document.body.classList.remove('full-screen-pseudo');
            onFullscreenOff(el);

            return Promise.resolve();
        }
    }
}

module.exports = new Fullscreen();
