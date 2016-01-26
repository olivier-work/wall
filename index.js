var express = require('express');
var exphbs  = require('express-handlebars');
var bodyParser = require('body-parser');
var fs = require('fs');
var path = require('path');
var jsonMarkup = require('json-markup');

var app = express();

var currentEvent = require('./events/bar.json');

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(bodyParser.urlencoded({extended: true}));

app.get('/welcome', function(req, res) {
  res.render('welcome', currentEvent);
});

app.get('/moderator', function(req, res) {
  res.render('moderator', currentEvent);
});

app.get('/thank-you', function(req, res) {
  res.render('thank-you');
});

app.get('/event', function(req, res) {
  fs.readdir(path.join(__dirname + '/events/'), function(err, events) {
    events = events.map(function(event) {
      return event.split('.')[0];
    })

    console.log(currentEvent)
    console.log(jsonMarkup(currentEvent))

    res.render('events-list', {
      events: events,
      currentEvent: jsonMarkup(currentEvent)
    });
  })
});

app.post('/set-current-event', function(req, res) {
  var eventSlug = req.body.event;
  currentEvent = require('./events/' + eventSlug);

  res.redirect('/event');
})

app.get('/create-event', function(req, res) {
  res.render('create-event');
});

app.post('/event', function(req, res) {
  var errors = [];

  if(!req.body.slug) {
    errors.push('slug is required');
  }
  if(!req.body.title) {
    errors.push('title is required');
  }
  if(!req.body.members) {
    errors.push('need at least one member');
  } else {
    req.body.members = req.body.members.split(',').map(function(member) {
      return {
        name: member.trim()
      }
    });
  }

  if(errors.length > 0) {
    return res.render('create-event', {
      errors: errors
    });
  }

  fs.writeFile(path.join(__dirname + '/events/' + req.body.slug + '.json'), JSON.stringify(req.body, 2, 2), function(err) {
    res.redirect('/event');
  });
});

app.listen(4621);
