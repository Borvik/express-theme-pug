'use strict';

let core = require('./core'),
    express = require('./express'),
    pug = require('./pug');

class ExpressThemePug {

  constructor() {
    this.core = new core(this);
    this.express = new express(this);
    this.pug = new pug(this);
  }

  /**
   * Initializes a new instance of the theme manager.
   */
  static init() {
    let manager = new ExpressThemePug();
    return function(req, res, next) {
      manager.register(res);
      next();
    };
  }

  /**
   * Registers new functions, overrides, and hooks into the
   * response and view rendering procedures.
   * 
   * @param {Express.Response} res The Express.Response object.
   */
  register(res) {
    this.core.register(res);
    this.express.register(res);
    this.pug.register(res);
  }
}

module.exports = ExpressThemePug.init();