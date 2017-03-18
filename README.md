# express-theme-pug
Node middleware to enable themes for Express and Pug.

The aim with express-theme-pug is to allow for a folder structure like the following.
```
views/
├── theme_1/
│   ├── account/
│   │   └── dashboard.pug
│   ├── layout.pug
│   └── page_1.pug
├── theme_2/
│   ├── account/
│   │   └── dashboard.pug
│   └── layout.pug
└── default/
    ├── account/
    │   ├── dashboard.pug
    │   └── login.pug
    ├── layout.pug
    ├── page_1.pug
    └── page_2.pug
    
```
When a theme is specified it should use that theme's folder - if the file exists, otherwise it should fall back to the `default` theme. This should hold true for the `res.render()` method, as well as for `extends` and `include` directives within Pug.

## Basic Usage

Treat the theme directory (ex. views/default, views/theme\_1, views/theme\_2) as if it was the root view directory when referencing files within the theme (such as the `res.render()` calls or with Pug `include` or `extends` directives).

## Express Usage

```javascript
// index.js or app.js - whatever loads your application
app.use(require(''));

// you can set your global theme
app.set('theme', 'theme_1');
// or you can use app.locals
app.locals.theme = 'theme_1';

// in your routes:
app.get('/', function(req, res) {
  res.theme('theme_2');
  res.render('account/dashboard');

  // it could also be chained
  res.theme('theme_2').render('account/dashboard');

  /***
   * Normally might become views/account/login (depending on where you set your view directory)
   * With express-theme-pug it becomes views/theme_2/account/login
   */
});
```

## Pug Usage

```javascript
//- In file views/theme_1/account/dashboard.pug
include ../layout.pug
include login.pug
//- This might normally become:
//-   views/theme_1/layout.pug  and
//-   views/theme_1/account/login.pug
//-
//- However with themes if the file doesn't exist
//- it could become:
//-   views/default/layout.pug
//-   views/default/account/login.pug
```
## Theme Rules

There are three places you can specify the theme to use: the `res` object for the current request, `app.set()`, or `app.locals` for the application default.

The basic rule for which theme to use is `res` always takes precendence, followed by `app.locals.theme`, and then `app.set('theme', value)`.  If a theme was not specified by any means `default` will be used as the theme.

Once the theme is determined, it checks the files to see if it can use the theme. There are three checks here, the specified themes directory, the global theme (if specified), and the `default` theme directory.  It does **_not_** fall back to the root folder, as this could cause issues with subdirectories that have been named the same as a theme.

So for instance if `app.locals.theme` is set to `theme_1`, and the `res` theme was was to `theme_2` the checks would happen like this:

1. Check `theme_2` if requested file exists
2. Check `theme_1` if requested file exists
3. Check `default` if requested file exists

If a check passes, the others do not get run. If none pass, an error gets thrown.

As this is checked for each file, it could result in some unexpected (yet designed) behavior.

```javascript
app.set('theme', 'theme_1');
res.theme('theme_2').render('file-with-include'); // file only exists in theme_1

//- file-with-include.pug (theme_1)
include file_in_both.pug
```
In the above scenario, even though `theme_2` is requested it uses the `file-with-include` from `theme_1` because it doesn't exist in `theme_2` and it was able to fall back. The unexpected part comes with `include file_in_both.pug`. Here you might think it would grab the file from `theme_1`, because it's relative to `file-with-include` - however, because `theme_2` was the requested theme, and `file_in_both.pug` exists there **that** is the file that would get used.