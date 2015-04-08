define(function (require, exports, module) {
    "use strict";

    var _launcherInstance;

    function Launcher(options) {
        var _browser = options.browser;
        var _server = options.server;

        Object.defineProperty(this, "browser", {
            configurable: false,
            get: function () {
                return _browser;
            }
        });

        Object.defineProperty(this, "server", {
            configurable: false,
            get: function () {
                return _server;
            }
        });

        _launcherInstance = this;
    }

    Launcher.prototype.launch = function(url) {
        console.log("launch", url);
        var server = this.server;
        var browser = this.browser;

        server.serveLiveDoc(url, function(err, url) {
            if (err) {
                throw err;
            }
            console.log("before update", browser);
            browser.update(url);
        });
    };

    Launcher.getCurrentInstance = function() {
        return _launcherInstance;
    };

    // Define public API
    module.exports = Launcher;
});
