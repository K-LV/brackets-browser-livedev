/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets */
define(function (require, exports, module) {
    "use strict";

    var BaseServer              = brackets.getModule("LiveDevelopment/Servers/BaseServer").BaseServer,
        LiveDevelopmentUtils    = brackets.getModule("LiveDevelopment/LiveDevelopmentUtils"),
        BlobUtils               = brackets.getModule("filesystem/impls/filer/BlobUtils"),
        Filer                   = brackets.getModule("filesystem/impls/filer/BracketsFiler"),
        Content                 = brackets.getModule("filesystem/impls/lib/content"),
        Handlers                = brackets.getModule("filesystem/impls/lib/handlers"),
        Rewriter                = brackets.getModule("filesystem/impls/lib/HTMLRewriter"),
        Log                     = brackets.getModule("filesystem/impls/lib/log");

    var Path = Filer.Path;

    function HTMLServer(config) {
        config = config || {};
        BaseServer.call(this, config);
    }

    HTMLServer.prototype = Object.create(BaseServer.prototype);
    HTMLServer.prototype.constructor = HTMLServer;

    //Returns a pre-generated blob url based on path
    HTMLServer.prototype.pathToUrl = function(path) {
        return BlobUtils.getUrl(path);
    };
    //Returns a path based on blob url
    HTMLServer.prototype.urlToPath = function(url) {
        return BlobUtils.getFilename(url);
    };

    HTMLServer.prototype.start = function() {
        this.fs = Filer.fs();
    };

    HTMLServer.prototype.stop = function() {
        this.fs = null;
    };

    /**
     * Determines if this server can serve local file. LiveDevServerManager
     * calls this method when determining if a server can serve a file.
     * @param {string} localPath A local path to file being served.
     * @return {boolean} true When the file can be served, otherwise false.
     */
    HTMLServer.prototype.canServe = function (localPath) {
        // If we can't transform the local path to a project relative path,
        // the path cannot be served
        if (localPath === this._pathResolver(localPath)) {
            return false;
        }

        // Url ending in "/" implies default file, which is usually index.html.
        // Return true to indicate that we can serve it.
        if (localPath.match(/\/$/)) {
            return true;
        }

        // FUTURE: do a MIME Type lookup on file extension
        return LiveDevelopmentUtils.isStaticHtmlFileExt(localPath);
    };

    /**
     * When a livedocument is added to the server cache, make sure live
     * instrumentation is enabled
     */
    HTMLServer.prototype.add = function (liveDocument) {
        if (liveDocument.setInstrumentationEnabled) {
            // enable instrumentation
            liveDocument.setInstrumentationEnabled(true);
        }
        BaseServer.prototype.add.call(this, liveDocument);
    };

    /**
     * Serve the contents of a path into the filesystem,
     * invoking the appropriate content handler, and rewriting any resources
     * in the local filesystem to Blob URLs.
     */
    HTMLServer.prototype.servePath = function(path, callback) {
        var fs = this.fs;

        fs.stat(path, function(err, stats) {
            if(err) {
                return callback(err);
            }

            // If this is a dir, error
            if(stats.isDirectory()) {
                return callback(new Error('expected file path'));
            }

            // This is a file, pick the right content handler based on extension
            var ext = Path.extname(path);

            if(Content.isHTML(ext)) {
                Handlers.handleFile(path, callback);
            } else {
                Handlers.handleFile(path, callback);
            }
        });
    };

    /**
     * Serve an existing HTML fragment/file (i.e., one that has already been read
     * for a given path) from the local filesystem, rewriting any resources
     * in the local filesystem to Blob URLs. The original path of the file is needed
     * in order to locate other resources with paths relative to this file.
     */
    HTMLServer.prototype.serveHTML = function(html, path, callback) {
        Rewriter.rewrite(path, html, function(err, rewrittenHTML) {
            if(err) {
                Log.error('unable to rewrite HTML for `' + path + '`');
                // TODO: best way to deal with error here? 500?
                return Handlers.handleFile(path, callback);
            }

            callback(null, rewrittenHTML);
        });
    };

    /**
     * If a livedoc exists, serves the instrumented version of the file as as a blob URL.
     * Otherwise, it serves only the file's contents as a blob URL.
     */
    HTMLServer.prototype.serveLiveDoc = function(url, callback) {
        var path = BlobUtils.getFilename(url);
        var liveDocument = this._liveDocuments[path];

        function toURL(err, html) {
            if (err) {
                callback(err);
                return;
            }

            // Convert rewritten HTML to a Blob URL Object
            var url = Content.toURL(html, "text/html");

            // BlobUtils.cache(path, function(err) {
            //     if(err) {
            //         Log.error("unable to cache file " + path);
            //         return;
            //     }
            //     callback(null, url);
            // });
            callback(null, url);
        }

        // If we have a LiveDoc for this path, send instrumented response. Otherwise fallback to static file from fs
        if (liveDocument && liveDocument.getResponseData) {
            Rewriter.rewrite(path, liveDocument.getResponseData().body, toURL);
        }
    };

    exports.HTMLServer = HTMLServer;
});
