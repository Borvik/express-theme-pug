'use strict';

let fs = require('fs'),
    path = require('path');

class PugThemer {
  
  /**
   * Initializes an new instance of PugThemer and returns the middleware function.
   */
  static init() {
    PugThemer.theme_cache = {};

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
    if (!req.app.response.theme) {
      req.app.response.theme = function(theme) {
        if (arguments.length) {
          this._theme = theme;
          return this;
        }
        return this._theme || req.app.locals.theme || req.app.get('theme') || 'default';
      };
    }

    let vw = req.app.get('view');

    if (!PugThemer._viewLookup) {
      PugThemer._viewLookup = vw.prototype.lookup;
      vw.prototype.lookup = function(name) {
        return name;
      };
    }
    if (!PugThemer._viewRender) {
      PugThemer._viewRender = vw.prototype.render;
      vw.prototype.render = function(options, callback) {
        let p = options['express-theme-pug.realpath'];
        //console.log(' Render (default):', this.path);
        //console.log(' Render (actual): ', p);
        let checkFile = path.join(path.dirname(p), PugThemer.appendExt(null, path.basename(p), this.ext));
        let realFile = PugThemer._viewLookup.call(this, checkFile);
        delete options['express-theme-pug.realpath'];
        this.engine(realFile, options, callback);
      };
    }

    /**
     * Replace the default render function so it is theme aware.
     */
    if (!PugThemer._responseRender) {
      PugThemer._responseRender = req.app.response.render;
      req.app.response.render = function(view, renderOptions, fn) {
        let options = renderOptions;
        let callback = fn;

        if (typeof renderOptions === 'function') {
          callback = renderOptions;
          options = {};
        }
        if (typeof options === 'undefined') {
          options = {};
        }

        let cache = this.app.enabled('view cache'),
            themeKey = path.join(PugThemer.getThemeKey(this), view),
            cachedObject = null;
        
        if (cache) {
          cachedObject = PugThemer.theme_cache[themeKey];
        }
        
        if (!cachedObject) {
          console.log('Building cache['+themeKey+']: ', cache ? 'true' : 'false');
          let themePrefix = PugThemer.getThemePrefix(this, view);
          if (themePrefix === '') {
            let dirs = Array.isArray(PugThemer.baseViews) && PugThemer.baseViews.length > 1 ?
                'directories "' + PugThemer.baseViews.slice(0, -1).join('", "') + '" or "' + PugThemer.baseViews[PugThemer.baseViews.length - 1] + '"' :
                'directory "' + PugThemer.baseViews + '"';
            throw new Error('Failed to lookup view "' + view + '" in views ' + dirs);
          }

          cachedObject = {
            realpath: path.join(themePrefix, view),
            cachepath: themeKey
          };
          if (cache) {
            PugThemer.theme_cache[themeKey] = cachedObject;
          }
        }
        console.log(' Using: ', cachedObject);
        options['express-theme-pug.realpath'] = cachedObject.realpath; // path.join(themePrefix, view);
        return PugThemer._responseRender.call(this, cachedObject.cachepath, options, callback); //path.join(this.theme(), view)
      };
    }
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
    //console.log('Pug: ', views);
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
        originalTarget = PugThemer.appendExt(res, originalTarget);

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
  }

  static getThemes(res) {
    let reqTheme = res.theme();
    let defaultTheme = res.app.locals.theme || res.app.get('theme') || 'default';
    if (reqTheme === defaultTheme && defaultTheme !== 'default')
      defaultTheme = 'default';
    return [reqTheme, defaultTheme, 'default'].filter(function(x,i,a){ return i === a.indexOf(x); });
  }

  static getThemeKey(res) {
    return PugThemer.getThemes(res).join('-');
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

    let themes = PugThemer.getThemes(res);
    let themeKey = themes.join('.');

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

  static appendExt(res, file, ext) {
    let fileExt = path.extname(file);
    if (fileExt === '') {
      if (!ext) {
        ext = res.app.get('view engine');
        ext = ext[0] !== '.' ? '.' + ext : ext;
      }
      return file + ext;
    }
    return file;
  }
}

module.exports = PugThemer.init();