var createCustomEvent = function (name) {
    var event = null;

    if (/Trident\/|MSIE/.test(window.navigator.userAgent)) {
        event = document.createEvent('HTMLEvents');
        event.initEvent(name, false, false);
    } else 
        event = new Event(name);

    return event;
}

module.exports = {
    createCustomEvent: createCustomEvent
};