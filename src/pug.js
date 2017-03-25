'use strict';

let fs = require('fs'),
    path = require('path');

class PugTheme {

  constructor(manager) {
    this.manager = manager;
    this.core = manager.core;
    this.cache = {};
  }

  register(res) {
    /**
     * This sets up the pug lexer and allows us to go through it before
     * the paths get used.
     */
    let self = this;
    res.locals.plugins = [{
      postLex: function(value, options) {
        self.postPugLexer(res, value, options);
        return value;
      }
    }];

    let vw = res.app.get('view');
    if (!vw.prototype.pug_engine) {
      vw.prototype.pug_engine = function(file, options, callback) {
        return self.pug_engine(this, file, options, callback);
      };
    }
  }

  /**
   * Handles the pug express rendering.
   * 
   * Because we need to handle pug caching, we need to implement the
   * following pug chain
   * __express -> renderFile -> handleTemplateCache
   * 
   * @param {Express.View} view The view object from ExpressJS.
   * @param {String} file 
   * @param {Object} options 
   * @param {Function} callback 
   */
  pug_engine(view, file, options, callback) {
    if (view.ext !== '.pug') return view.engine(file, options, callback);
    
    if (typeof options === 'function') {
      callback = options;
      options = undefined;
    }
    
    if ((!options || options.compileDebug === undefined) && process.env.NODE_ENV === 'production') {
      if (!options) options = {};
      options.compileDebug = false;
    }
    this.renderFile(view, file, options, callback);
  }

  /**
   * Render a Pug file at the given `file`. (override)
   *
   * @param {Express.View} view The view object from ExpressJS.
   * @param {String} file
   * @param {Object|Function} options or callback
   * @param {Function|undefined} fn
   * @returns {String}
   */
  renderFile(view, file, options, fn) {
    if (typeof fn === 'function') {
      let result;
      try {
        result = this.renderFile(view, file, options);
      } catch (ex) {
        return fn(ex);
      }
      return fn(null, result);
    }

    options = options || {};
    options.filename = file;
    return this.handleTemplateCache(view, options)(options);
  }

  /**
   * Get the template from a string or a file, either compiled on-the-fly or
   * read from cache (if enabled), and cache the template if needed.
   *
   * If `options.cache` is true, this function reads the file from
   * `options.filename` so it must be set prior to calling this function.
   *
   * @param {Express.View} view The view object from ExpressJS.
   * @param {Object} options
   * @return {Function}
   */
  handleTemplateCache(view, options) {
    let key = view.themekey;
    
    if (options.cache && this.cache[key])
      return this.cache[key];
    
    let str = fs.readFileSync(options.filename, 'utf8');
    let templ = require('pug').compile(str, options);
    if (options.cache) this.cache[key] = templ;
    return templ;
  }

  /**
   * Processes the Pug lexer tokens for paths and updates them for the theme.
   * 
   * @param {Express.Response} res The Express Response object.
   * @param {Array} tokens Tokens returned by the pug lexer.
   * @param {Object} options Lexer options.
   */
  postPugLexer(res, tokens, options) {
    let views = this.core.get_theme_defs(res);
    
    let currentTheme = null;
    for (const view of views) {
      let relative = path.relative(view.path, options.filename);
      if (relative[0] !== '.') {
        currentTheme = view;
        currentTheme.relativeToFile = relative;
        break;
      }
    }

    for (let token of tokens) {
      if (token.type === 'path') {
        let originalTarget = path.join(path.dirname(options.filename), token.val);
        originalTarget = this.core.append_ext(res, originalTarget);

        for (const view of views) {
          let relativeToCurrentView = path.relative(currentTheme.path, originalTarget);
          
          let viewPath = path.join(view.path, relativeToCurrentView);
          let filePath = path.resolve(viewPath);
          
          if (fs.existsSync(filePath)) {
            token.val = path.relative(path.dirname(options.filename), filePath);
            break;
          }
        } // for:views
      } // if:token.type
    } // for:token
  } // function:postPugLexer
}

module.exports = PugTheme;