'use strict';

let fs = require('fs'),
    path = require('path');

class PugThemer {
  
  /**
   * Initializes an new instance of PugThemer and returns the middleware function.
   */
  static init() {
    let themer = new PugThemer();
    return function(req, res, next) {
      themer.onTheme(req, res);
      next();
    };
  }

  /**
   * The REAL middleware function, setups of the Pug lexer, the response functions and calls the theme render.
   * 
   * @param {Express.Request} req The Express.Request object
   * @param {Express.Response} res The Express.Response object
   */
  onTheme(req, res) {
    /**
     * This sets up the pug lexer and allows us to go through it before
     * the paths get used.
     */
    res.locals.plugins = [{
      postLex: function(value, options) {
        PugThemer.postPugLexer(res, value, options);
        return value;
      }
    }];

    /**
     * Sets up the theme function on the response objection.
     * If a parameter is passed - set the theme only for this response.
     * Otherwise attempt to get the theme based on the following priority:
     * response.theme
     * app.locals.theme - app global
     * app.get('theme') - app global (two different ways to set, one needs priority)
     * finally use the "default" theme
     */
    res.theme = function(theme) {
      if (arguments.length) {
        this._theme = theme;
        return this;
      }
      return this._theme || req.app.locals.theme || req.app.get('theme') || 'default';
    };

    /**
     * Replace the default render function so it is theme aware.
     */
    let _render = res.render;
    res.render = function(view, renderOptions, fn) {
      let themePrefix = PugThemer.getThemePrefix(res, view);
      if (themePrefix === '') {
        let dirs = Array.isArray(PugThemer.baseViews) && PugThemer.baseViews.length > 1 ?
            'directories "' + PugThemer.baseViews.slice(0, -1).join('", "') + '" or "' + PugThemer.baseViews[PugThemer.baseViews.length - 1] + '"' :
            'directory "' + PugThemer.baseViews + '"';
        throw new Error('Failed to lookup view "' + view + '" in views ' + dirs);
      }
      _render.call(this, path.join(themePrefix, view), renderOptions, fn);
    };
  }

  /**
   * Processes the Pug lexer tokens for paths and updates them for the theme.
   * 
   * @param {Express.Response} res The Express Response object.
   * @param {Array} tokens Tokens returned by the pug lexer.
   * @param {Object} options Lexer options.
   */
  static postPugLexer(res, tokens, options) {
    let views = PugThemer.getThemeViews(res);

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
        for (const view of views) {
          let originalTarget = path.join(path.dirname(options.filename), token.val);
          originalTarget = PugThemer.appendExt(res, originalTarget);
          
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
  }

  /**
   * Gets an array of the theme views and caches theme as they are generated.
   * 
   * @param {Express.Response} res The Express Response object.
   */
  static getThemeViews(res) {
    if (!PugThemer.baseViews) {
      PugThemer.baseViews = res.app.get('views');
      if (!Array.isArray(PugThemer.baseViews)) PugThemer.baseViews = [PugThemer.baseViews];
    }

    if (!PugThemer.views) PugThemer.views = {};

    let reqTheme = res.theme();
    let defaultTheme = res.app.locals.theme || res.app.get('theme') || 'default';
    if (reqTheme === defaultTheme && defaultTheme !== 'default')
      defaultTheme = 'default';
    let themeKey = reqTheme+'.'+defaultTheme;
    let themes = [reqTheme, defaultTheme, 'default'].filter(function(x,i,a){ return i === a.indexOf(x); });

    if (!PugThemer.views[themeKey]) {
      let views = [];
      for(const view of PugThemer.baseViews) {
        for(const theme of themes) {
          views.push({theme: theme, path: path.join(view, theme), base: view});
        }
      }
      PugThemer.views[themeKey] = views;
    }
    return PugThemer.views[themeKey];
  }

  /**
   * Gets the theme for the specified file.
   * 
   * Note: Does not return the full path, just the prefix needed before the specified viewFile.
   * 
   * @param {Express.Response} res The Express Response object.
   * @param {String} viewFile The view file being accessed.
   */
  static getThemePrefix(res, viewFile) {
    let views = PugThemer.getThemeViews(res);
    viewFile = PugThemer.appendExt(res, viewFile);

    let viewFound = false;
    for(const view of views) {
      let viewPath = path.join(view.path, viewFile);
      if (fs.existsSync(viewPath)) {
        viewFound = view.theme;
        break;
      }
    }
    return viewFound ? viewFound : '';
  }

  static appendExt(res, file) {
    let fileExt = path.extname(file);
    if (fileExt === '') {
      let ext = res.app.get('view engine');
      ext = ext[0] !== '.' ? '.' + ext : ext;
      return file + ext;
    }
    return file;
  }
}

module.exports = PugThemer.init();