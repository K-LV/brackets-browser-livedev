/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets */
define(function (require, exports, module) {
    "use strict";

    var BaseServer              = brackets.getModule("LiveDevelopment/Servers/BaseServer").BaseServer,
        BlobUtils               = brackets.getModule("filesystem/impls/filer/BlobUtils"),
        Filer                   = brackets.getModule("filesystem/impls/filer/BracketsFiler");

    function NewStaticServer(config) {
        config = config || {};
        BaseServer.call(this, config);
    }

    NewStaticServer.prototype = Object.create(BaseServer.prototype);
    NewStaticServer.prototype.constructor = NewStaticServer;

    //Returns a pre-generated blob url based on path
    NewStaticServer.prototype.pathToUrl = function(path) {
        return BlobUtils.getUrl(path);
    };
    //Returns a path based on blob url
    NewStaticServer.prototype.urlToPath = function(url) {
        return BlobUtils.getFilename(url);
    };

    NewStaticServer.prototype.start = function() {
        this.fs = Filer.fs();
    };

    NewStaticServer.prototype.stop = function() {
        this.fs = null;
    };

    exports.NewStaticServer = NewStaticServer;
});
