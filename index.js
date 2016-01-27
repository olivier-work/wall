var express = require('express');
var exphbs  = require('express-handlebars');
var bodyParser = require('body-parser');
var fs = require('fs');
var path = require('path');
var jsonMarkup = require('json-markup');
var slugify = require('slugify');
var app = express();

var currentEvent = require('./events/bar.json');

// paths
const storesJsonPath = path.join(__dirname, '/stores', '/stores.json');

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(bodyParser.urlencoded({extended: true}));

// Serve static files
app.use(express.static('public'));

app.get('/', function(req, res) {
  res.redirect('/stores');
});

// Slides routes
app.get('/slides/welcome', function(req, res) {
  res.render('welcome', currentEvent);
});
app.get('/slides/moderator', function(req, res) {
  res.render('moderator', currentEvent);
});
app.get('/slides/thank-you', function(req, res) {
  res.render('thank-you');
});

app.get('/stores', function(req, res) {
  fs.readdir(path.join(__dirname, '/stores'), function(err, stores) {
    if (stores) {
      res.render('stores', {
        stores: stores
      });
    }
  });
});

app.get('/store/:storeSlug', function(req, res, next) {
  const storeSlug = req.params.storeSlug;

  fs.readdir(path.join(__dirname, '/stores', storeSlug), function(err, events) {
    events = events.map(function(event) {
      return event.split('.')[0];
    });

    fs.readFile(storesJsonPath, function(err, storesStr) {
      const stores = JSON.parse(storesStr);
      res.render('store', {
        events: events,
        storeSlug: storeSlug,
        store: stores[storeSlug]
      });

    });
  });
});

app.get('/event', function(req, res) {
  fs.readdir(path.join(__dirname + '/events/'), function(err, events) {
    events = events.map(function(event) {
      return event.split('.')[0];
    });

    res.render('events-list', {
      events: events,
      currentEvent: jsonMarkup(currentEvent)
    });
  });
});

// app.post('/set-current-event', function(req, res) {
//   const eventSlug = req.body.event;
//   currentEvent = require('./events/' + eventSlug);
//   res.redirect('/event');
// });

app.get('/store/:store_slug/create-event', function(req, res) {
  const storeSlug = req.params.store_slug;
  const storesPath = path.join(__dirname + '/stores');

  fs.readdir(storesPath, function(err, stores) {
    res.render('create-event', {
      stores: stores,
      storeSlug: storeSlug
    });
  });
});

app.post('/store', function(req, res) {
  var errors = [];
  var form = req.body || {};

  if (!form.name) {
    errors.push('name is required');
  }

  if (!form.ip) {
    errors.push('ip is required');
  }

  if (errors.length > 0) {
    return res.render('create-store', {
      errors: errors
    });
  }

  const storeSlug = slugify(form.name);
  const storePath = path.join(__dirname, '/stores', storeSlug);

  const event = {
    slug: storeSlug,
    ip: form.ip,
    name: form.name
  }

  if (!fs.existsSync(storePath)) {
    fs.mkdirSync(storePath);
  }

  fs.readFile(storesJsonPath, function(err, storesStr) {
    storesStr = storesStr.toString();
    var stores = JSON.parse(storesStr);
    stores[storeSlug] = event;

    fs.writeFile(storesJsonPath, JSON.stringify(stores, null, 2), 'utf-8', function(err) {
      res.redirect('/store/' + storeSlug);
    });
  });
});

app.get('/create-store', function(req, res) {
  res.render('create-store');
});

app.post('/store/:store_slug/event', function(req, res) {
  var errors = [];
  var form = req.body || {};
  const storeSlug = req.params.store_slug;

  form.storeSlug = storeSlug;

  if (!form.store) {
    errors.push('store is required');
  } else if (!fs.existsSync(path.join(__dirname, '/stores', form.store))) {
    errors.push('store does not exist');
  }

  if (!form.name) {
    errors.push('name is required');
  }

  if (!form.members) {
    errors.push('need at least one member');
  } else {
    form.members = form.members.split(',').map(function(member) {
      return {
        name: member.trim()
      }
    });
  }

  if (errors.length > 0) {
    return res.render('create-event', {
      errors: errors
    });
  }

  var eventPath = path.join(__dirname, '/stores', form.store, slugify(form.name));

  fs.writeFile(eventPath, JSON.stringify(form, null, 2), function(err) {
    res.redirect(path.join('/store', storeSlug));
  });
});

app.listen(process.env.PORT || 4621);