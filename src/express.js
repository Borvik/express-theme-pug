'use strict';

let path = require('path');

class ExpressTheme {

  constructor(manager) {
    this.manager = manager;
    this.core = manager.core;
    this.theme_cache = {};
  }

  register(res) {
    let self = this;
    if (!this._lookup || !this._viewrender) {
      let vw = res.app.get('view');

      if (!this._lookup) {
        /**
         * res.render override already does the check that normally would
         * happen within the view - just return the name so that the view
         * actually tries to render
         */
        this._lookup = vw.prototype.lookup;
        vw.prototype.lookup = function(name) { return name; };
      }

      if (!this._viewrender) {
        /**
         * We need to get the theme info that has already been
         * processed out of the options, and render the correct file.
         */
        this._viewrender = vw.prototype.render;
        vw.prototype.render = function(options, callback) {
          this.themekey = options['express-theme-pug.themekey'];
          let p = options['express-theme-pug.realpath'];
          let checkFile = path.join(path.dirname(p), self.core.append_ext(null, path.basename(p), this.ext));
          let realFile = self._lookup.call(this, checkFile);

          delete options['express-theme-pug.realpath'];
          delete options['express-theme-pug.themekey'];
          this.pug_engine(realFile, options, callback);
        };
      }
    }
    
    /**
     * Replace the default render function so it is theme aware
     * and passes on the theme information to the override view.
     */
    if (!this._render) {
      this._render = res.app.response.render;
      res.app.response.render = function(view, options, callback) {
        return self.response_render(this, view, options, callback);
      };
    }
  }

  /**
   * Override for the response.render function. Adjusts the view for the requested theme.
   * 
   * @param {Express.Response} res The Express.Reponse object.
   * @param {String} view The requested view
   * @param {Object} options 
   * @param {Function} callback 
   */
  response_render(res, view, options, callback) {
    let done = callback,
        opts = options || {},
        cache = res.app.enabled('view cache'),
        themeKey = path.join(this.core.get_theme_key(res), view),
        cachedView = null;

    if (typeof options === 'function') {
      done = options;
      opts = {};
    }
        
    if (cache) {
      cachedView = this.theme_cache[themeKey];
    }
    
    if (!cachedView) {
      cachedView = {
        realpath: this.core.get_real_path(res, view),
        cachepath: themeKey
      };
      
      if (cache) {
        this.theme_cache[themeKey] = cachedView;
      }
    }
    
    opts['express-theme-pug.realpath'] = cachedView.realpath; // path.join(themePrefix, view);
    opts['express-theme-pug.themekey'] = themeKey;
    return this._render.call(res, cachedView.cachepath, opts, done); //path.join(this.theme(), view)
  }
}

module.exports = ExpressTheme;