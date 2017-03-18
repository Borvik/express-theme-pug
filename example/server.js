let express = require('express'),
    app = express(),
    path = require('path');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(require('../src')); //include our middleware

app.use(function(req, res, next) {
  if (req.query.app) {
    app.set('theme', req.query.app); //set the theme could be before or after requiring
  }
  if (req.query.local) {
    app.locals.theme = req.query.local;
  }
  next();
});

// setup the routes
app.get('/', function(req, res) {
  res.render('root');
});

app.get('/favicon.ico', function(req, res) {
  res.status(404).send('Not Found');
});

app.get('/:file', function(req, res) {
  if (req.query.theme) {
    res.theme(req.query.theme);
  }
  res.render(req.params.file);
});

app.get('/test/:file', function(req, res) {
  if (req.query.theme) {
    res.theme(req.query.theme);
  }
  res.render('test/' + req.params.file);
});

app.use(function(err, req, res, next) {
  if (!global.TESTING)
    next(err);
  res.status(500).send(err.message);
});

module.exports = app;