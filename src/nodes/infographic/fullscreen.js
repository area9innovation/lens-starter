var screenfull = require('screenfull'),
    createCustomEvent = require('./utils').createCustomEvent;

var Fullscreen = function () {
    var isFullscreen = screenfull.enabled ? screenfull.isFullscreen : false,
        fullscreenElement = null,
        parentNode = null,
        fullscreenOnEvent = createCustomEvent('full-screen-on'),
        fullscreenOffEvent = createCustomEvent('full-screen-off');

    var onFullscreenOn = function (el) {
        el.classList.add('full-screen');
        fullscreenElement = el;
        isFullscreen = true;
        window.dispatchEvent(fullscreenOnEvent);
    };

    var onFullscreenOff = function (el) {
        el.classList.remove('full-screen');
        fullscreenElement = null;
        isFullscreen = false;
        window.dispatchEvent(fullscreenOffEvent);
    };

    return {
        enabled: function () { return true; },
        isFullscreen: function () { return isFullscreen; },
        request: function (el) {
            if (screenfull.enabled) 
                return screenfull.request(el).then(function () { onFullscreenOn(el); });

            parentNode = el.parentNode;

            document.body.appendChild(el);
            document.body.classList.add('full-screen-pseudo');
            onFullscreenOn(el);

            return Promise.resolve();
        },
        exit: function () {
            if (screenfull.enabled) 
                return screenfull.exit(fullscreenElement).then(function () { onFullscreenOff(fullscreenElement); });

            parentNode.appendChild(fullscreenElement);
            document.body.classList.remove('full-screen-pseudo');
            onFullscreenOff(fullscreenElement);

            parentNode = null;

            return Promise.resolve();
        }
    }
}

module.exports = new Fullscreen();