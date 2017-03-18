global.TESTING = true;

let assert = require('assert'),
    server = require('../example/server'),
    http = require('http'),
    path = require('path'),
    baseurl = 'http://localhost:8000/',
    viewPath = path.resolve(__dirname, '../example/views');

function getHttpData(url, done) {
  http.get(url, function(res) {
    let data = '', status = res.statusCode;
    res.on('data', function(chunk) { data += chunk; });
    res.on('end', function() { done(data, status); });
  });
}

assert.beginsWith = function beginsWith(actual, expected, message) {
  if (actual === null || actual.indexOf(expected) !== 0) assert.fail(actual, expected, message, 'beginsWith', assert.beginsWith);
};

describe('server', function() {
  let localServer;
  before(function() { localServer = server.listen(8000); });
  after(function() { localServer.close(); });

  describe('server is running', function() {
    it('should return 200', function(done) {
      http.get(baseurl + 'default', function(res) {
        assert.equal(res.statusCode, 200);
        done();
      });
    });
  });

  /*
  888888 Yb  dP 88""Yb 88""Yb 888888 .dP"Y8 .dP"Y8 
  88__    YbdP  88__dP 88__dP 88__   `Ybo." `Ybo." 
  88""    dPYb  88"""  88"Yb  88""   o.`Y8b o.`Y8b 
  888888 dP  Yb 88     88  Yb 888888 8bodP' 8bodP' 
  */
  describe('Express Themes', function() {
    /*
     dP 8888b.  888888 888888    db    88   88 88     888888 Yb  
    dP   8I  Yb 88__   88__     dPYb   88   88 88       88    Yb 
    Yb   8I  dY 88""   88""    dP__Yb  Y8   8P 88  .o   88    dP 
     Yb 8888Y"  888888 88     dP""""Yb `YbodP' 88ood8   88   dP  
    */
    describe('Theme: (default)', function() {
      it('/root -> View not found', function(done) {
        getHttpData(baseurl + 'root', function(data, status) {
          assert.equal(status, 500, 'Should return a 500 error');
          assert.equal(data, viewNotFoundError('root'), 'Wrong error message');
          done();
        });
      });

      it('/default -> "DEFAULT"', function(done) {
        getHttpData(baseurl + 'default', function(data) {
          assert.equal(data, 'DEFAULT');
          done();
        });
      });

      it('/a -> View not found', function(done) {
        getHttpData(baseurl + 'a', function(data, status) {
          assert.equal(status, 500, 'Should return a 500 error');
          assert.equal(data, viewNotFoundError('a'), 'Wrong error message');
          done();
        });
      });

      it('/b -> View not found', function(done) {
        getHttpData(baseurl + 'b', function(data, status) {
          assert.equal(status, 500, 'Should return a 500 error');
          assert.equal(data, viewNotFoundError('b'), 'Wrong error message');
          done();
        });
      });

      it('/test/default -> "DEFAULT test"', function(done) {
        getHttpData(baseurl + 'test/default', function(data) {
          assert.equal(data, 'DEFAULT test');
          done();
        });
      });

      it('/test/a -> View not found', function(done) {
        getHttpData(baseurl + 'test/a', function(data, status) {
          assert.equal(status, 500, 'Should return a 500 error');
          assert.equal(data, viewNotFoundError('test/a'), 'Wrong error message');
          done();
        });
      });

      it('/test/b -> View not found', function(done) {
        getHttpData(baseurl + 'test/b', function(data, status) {
          assert.equal(status, 500, 'Should return a 500 error');
          assert.equal(data, viewNotFoundError('test/b'), 'Wrong error message');
          done();
        });
      });
    });
    
    /*
    888888 88  88 888888 8b    d8 888888        db    
      88   88  88 88__   88b  d88 88__         dPYb   
      88   888888 88""   88YbdP88 88""        dP__Yb  
      88   88  88 888888 88 YY 88 888888     dP""""Yb 
    */
    describe('Theme: a', function() {
      it('/root -> "ROOT"', function(done) {
        getHttpData(baseurl + 'root?app=a', function(data, status) {
          assert.equal(status, 500, 'Should return a 500 error');
          assert.equal(data, viewNotFoundError('root'), 'Wrong error message');
          done();
        });
      });

      it('/default -> "DEFAULT"', function(done) {
        getHttpData(baseurl + 'default?app=a', function(data) {
          assert.equal(data, 'DEFAULT');
          done();
        });
      });

      it('/a -> "A"', function(done) {
        getHttpData(baseurl + 'a?app=a', function(data) {
          assert.equal(data, 'A');
          done();
        });
      });

      it('/b -> View not found', function(done) {
        getHttpData(baseurl + 'b?app=a', function(data, status) {
          assert.equal(status, 500, 'Should return a 500 error');
          assert.equal(data, viewNotFoundError('b'), 'Wrong error message');
          done();
        });
      });

      it('/test/default -> "DEFAULT test"', function(done) {
        getHttpData(baseurl + 'test/default', function(data) {
          assert.equal(data, 'DEFAULT test');
          done();
        });
      });

      it('/test/a -> "A test"', function(done) {
        getHttpData(baseurl + 'test/a', function(data) {
          assert.equal(data, 'A test');
          done();
        });
      });

      it('/test/b -> View not found', function(done) {
        getHttpData(baseurl + 'test/b', function(data, status) {
          assert.equal(status, 500, 'Should return a 500 error');
          assert.equal(data, viewNotFoundError('test/b'), 'Wrong error message');
          done();
        });
      });
    });

    /*
    888888 88  88 888888 8b    d8 888888     88""Yb 
      88   88  88 88__   88b  d88 88__       88__dP 
      88   888888 88""   88YbdP88 88""       88""Yb 
      88   88  88 888888 88 YY 88 888888     88oodP 
    */
    describe('Theme: b', function() {
      it('/root -> "ROOT"', function(done) {
        getHttpData(baseurl + 'root?app=b', function(data, status) {
          assert.equal(status, 500, 'Should return a 500 error');
          assert.equal(data, viewNotFoundError('root'), 'Wrong error message');
          done();
        });
      });

      it('/default -> "DEFAULT"', function(done) {
        getHttpData(baseurl + 'default?app=b', function(data) {
          assert.equal(data, 'DEFAULT');
          done();
        });
      });

      it('/a -> View not found', function(done) {
        getHttpData(baseurl + 'a?app=b', function(data, status) {
          assert.equal(status, 500, 'Should return a 500 error');
          assert.equal(data, viewNotFoundError('a'), 'Wrong error message');
          done();
        });
      });

      it('/a -> "A" (b default, a in response)', function(done) {
        getHttpData(baseurl + 'a?app=b&theme=a', function(data) {
          assert.equal(data, 'A');
          done();
        });
      });

      it('/a -> "A" (a default, b in response)', function(done) {
        getHttpData(baseurl + 'a?app=a&theme=b', function(data) {
          assert.equal(data, 'A');
          done();
        });
      });

      it('/b -> "B"', function(done) {
        getHttpData(baseurl + 'b?app=b', function(data) {
          assert.equal(data, 'B');
          done();
        });
      });

      it('/test/default -> "DEFAULT test"', function(done) {
        getHttpData(baseurl + 'test/default', function(data) {
          assert.equal(data, 'DEFAULT test');
          done();
        });
      });

      it('/test/a -> View not found', function(done) {
        getHttpData(baseurl + 'test/a', function(data, status) {
          assert.equal(status, 500, 'Should return a 500 error');
          assert.equal(data, viewNotFoundError('test/a'), 'Wrong error message');
          done();
        });
      });

      it('/test/b -> "B test"', function(done) {
        getHttpData(baseurl + 'test/b', function(data) {
          assert.equal(data, 'B test');
          done();
        });
      });
    });

    /*
     dP"Yb  Yb    dP 888888 88""Yb 88""Yb 88 8888b.  888888 .dP"Y8 
    dP   Yb  Yb  dP  88__   88__dP 88__dP 88  8I  Yb 88__   `Ybo." 
    Yb   dP   YbdP   88""   88"Yb  88"Yb  88  8I  dY 88""   o.`Y8b 
     YbodP     YP    888888 88  Yb 88  Yb 88 8888Y"  888888 8bodP' 
    */
    describe('Overrides', function() {
      it('/not-in-b -> (default) "Default Fallback"', function(done) {
        getHttpData(baseurl + 'not-in-b', function(data) {
          assert.equal(data, 'Default Fallback');
          done();
        });
      });

      it('/not-in-b -> (a) "Not-in-b"', function(done) {
        getHttpData(baseurl + 'not-in-b?theme=a', function(data) {
          assert.equal(data, 'Not-in-b');
          done();
        });
      });

      it('/not-in-b -> (b) "Default Fallback"', function(done) {
        getHttpData(baseurl + 'not-in-b?theme=b', function(data) {
          assert.equal(data, 'Default Fallback');
          done();
        });
      });
    });
  });

  /*
  88""Yb 88   88  dP""b8     888888 88  88 888888 8b    d8 888888 .dP"Y8 
  88__dP 88   88 dP   `"       88   88  88 88__   88b  d88 88__   `Ybo." 
  88"""  Y8   8P Yb  "88       88   888888 88""   88YbdP88 88""   o.`Y8b 
  88     `YbodP'  YboodP       88   88  88 888888 88 YY 88 888888 8bodP' 
  */
  describe('Pug Themes', function() {
    describe('Theme: (default)', function() {
      it('Parent (layout), child (include)', function(done) {
        getHttpData(baseurl + 'test/extend-default', function(data) {
          assert.equal(data, 'Default-extend-default-sub-default-');
          done();
        });
      });

      it('Layout does not exist', function(done) {
        getHttpData(baseurl + 'test/extend-default-fail', function(data) {
          assert.beginsWith(data, 'ENOENT: no such file or directory');
          done();
        });
      });
    });

    describe('Theme: (multiple)', function() {
      it('Multi-include test (B test -> a test, a, default, default-test-sub)', function(done) {
        getHttpData(baseurl + 'test/include-test?app=a&theme=b', function(data) {
          assert.equal(data, 'b-include-test-BA testADEFAULTsub-default-');
          done();
        });
      });

      it('Theme fallback (theme a)', function(done) {
        getHttpData(baseurl + 'include-test?theme=a', function(data) {
          assert.equal(data, 'a-include-test/ab-in-a');
          done();
        });
      });

      it('Theme fallback (theme b, app a - res render file only in a)', function(done) {
        getHttpData(baseurl + 'include-test?theme=b&app=a', function(data) {
          assert.equal(data, 'a-include-test/ab-in-b');
          done();
        });
      });
    });
  });
});

function viewNotFoundError(view) {
  return 'Failed to lookup view "' + view + '" in views directory "' + viewPath + '"';
}