'use strict';

let fs = require('fs'),
    path = require('path');

class ThemeCore {

  constructor(manager) {
    this.manager = manager;
  }

  register(res) {
    /**
     * Sets up the theme function on the response objection.
     * If a parameter is passed - set the theme only for this response.
     * Otherwise attempt to get the theme based on the following priority:
     * response.theme
     * app.locals.theme - app global
     * app.get('theme') - app global (two different ways to set, one needs priority)
     * finally use the "default" theme
     */
    if (!res.app.response.theme) {
      res.app.response.theme = function(theme) {
        if (arguments.length) {
          this._theme = theme;
          return this;
        }
        return this._theme || this.app.locals.theme || this.app.get('theme') || 'default';
      };
    }
  }

  /**
   * Gets an identifier for the requested theme (and it's fallbacks).
   * 
   * @param {Express.Response} res The Reponse object to get the requested themes from.
   * @returns {String}
   */
  get_theme_key(res) {
    return this.get_themes(res).join('-');
  }

  /**
   * Gets the requested theme, and fallbacks in an array.
   * 
   * @param {Express.Response} res The Reponse object to get the requested themes from.
   * @returns {Array<String>}
   */
  get_themes(res) {
    let reqTheme = res.theme();
    let defaultTheme = res.app.locals.theme || res.app.get('theme') || 'default';
    if (reqTheme === defaultTheme && defaultTheme !== 'default')
      defaultTheme = 'default';

    // return the distinct array
    return [reqTheme, defaultTheme, 'default'].filter(function(x,i,a){ return i === a.indexOf(x); });
  }

  /**
   * Gets an array of the theme views and caches theme as they are generated.
   * 
   * @param {Express.Response} res The Express Response object.
   * @returns {Array<Object>}
   */
  get_theme_defs(res) {
    if (!this.baseViews) {
      this.baseViews = res.app.get('views');
      if (!Array.isArray(this.baseViews)) this.baseViews = [this.baseViews];
    }

    if (!this.views) this.views = {};

    let themes = this.get_themes(res);
    let themeKey = themes.join('-');

    if (!this.views[themeKey]) {
      let views = [];
      for(const view of this.baseViews) {
        for(const theme of themes) {
          views.push({theme: theme, path: path.join(view, theme), base: view});
        }
      }
      this.views[themeKey] = views;
    }
    return this.views[themeKey];
  }

  /**
   * Gets the theme path for the requested file.
   * 
   * @param {Express.Response} res The Express Response object.
   * @param {String} viewFile The view file being accessed.
   */
  get_real_path(res, view) {
    let fileExt = path.extname(view);

    let views = this.get_theme_defs(res);
    let viewFile = this.append_ext(res, view);
    let indexViewFile = (fileExt === '') ? this.append_ext(res, view + '/index') : false;

    let viewFound = false, indexViewFound = false;
    for(const viewDef of views) {
      let viewPath = path.join(viewDef.path, viewFile);
      if (fs.existsSync(viewPath)) {
        viewFound = viewDef.theme;
        break;
      }

      // check for index file
      if (indexViewFile) {
        viewPath = path.join(viewDef.path, indexViewFile);
        if (fs.existsSync(viewPath)) {
          indexViewFound = true;
          viewFound = viewDef.theme;
          break;
        }
      }
    }

    if (!viewFound) {
      let dirs = Array.isArray(this.baseViews) && this.baseViews.length > 1 ?
          'directories "' + this.baseViews.slice(0, -1).join('", "') + '" or "' + this.baseViews[this.baseViews.length - 1] + '"' :
          'directory "' + this.baseViews + '"';
      throw new Error('Failed to lookup view "' + view + '" in views ' + dirs);
    }
    return indexViewFound ? path.join(viewFound, view + '/index') : path.join(viewFound, view);
  }

  /**
   * Appends an extension to the given file, if no extension is provided it uses the
   * extension that the extension assigned to the Express view engine.
   * 
   * @param {Express.Response} res The Express Response object.
   * @param {String} file The file to append the extension to.
   * @param {String} [ext] The extension to append to the file.
   * @returns {String}
   */
  append_ext(res, file, ext) {
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

module.exports = ThemeCore;