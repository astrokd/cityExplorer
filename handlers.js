'use strict';

const superagent = require('superagent');
const db = require('./db.js');

// object to contain previous locations
let locations = {};

function Location(city, locData) {
  this.search_query = city;
  this.formatted_query = locData.results[0].formatted_address;
  this.latitude = locData.results[0].geometry.location.lat;
  this.longitude = locData.results[0].geometry.location.lng;
}

function WeatherDay(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
}

function Trail(trail) {
  this.id = trail.id;
  this.name = trail.name;
  this.type = trail.type;
  this.summary = trail.summary;
  this.difficulty = trail.difficulty;
  this.stars = trail.stars;
  this.starVotes = trail.starVotes;
  this.location = trail.location;
  this.url = trail.url;
  this.imgSqSmall = trail.imgSqSmall;
  this.imgSmall = trail.imgSmall;
  this.imgSmallMed = trail.imgSmallMed;
  this.imgMedium = trail.imgMedium;
  this.length = trail.length;
  this.ascent = trail.ascent;
  this.descent = trail.descent;
  this.high = trail.high;
  this.low = trail.low;
  this.longitude = trail.longitude;
  this.latitude = trail.latitude;
  this.conditionStatus = trail.conditionStatus;
  this.conditionDetails = trail.conditionDetails;
  this.conditionDate = trail.conditionDate;
}

function locationHandler(req, res) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${req.query.data}&key=${process.env.GOOGLE_MAPS_KEY}`;

  console.log(`${req.query.data}`);

  const inDB = db.inDB(req.query.data);
  
  // check if in DB first
  if(inDB) {
    console.log(`${req.query.data} is in the database`);
    // res.send(locations[url]);
  }
  // get then push to DB if not there
  else {
    console.log(`${req.query.data} is not in the database`);
    superagent.get(url)
      .then(data => {
        // send the users current location back to them
        const location = new Location(req.query.data, data.body);
        db.putLocation(location);
        res.send(location);
      })
      .catch(err => errorHandler(err, req, res));
  }
}

function weatherHandler(req, res) {
  const url = `https://api.darksky.net/forecast/${process.env.DARK_SKY_KEY}/${req.query.data.latitude},${req.query.data.longitude}`;
  
  superagent.get(url)
    .then(data => {
      
      // send the client next 8 days forecast
      const weatherSummaries = data.body.daily.data.map(day => {
        return new WeatherDay(day);
      })
      
      res.status(200).json(weatherSummaries);
    })
    .catch(err => errorHandler(err, req, res));
}

function trailHandler(req, res) {
  const url = `https://www.hikingproject.com/data/get-trails?lat=${req.query.data.latitude}&lon=${req.query.data.longitude}&key=${process.env.HIKING_PROJECT_KEY}`;

  superagent.get(url)
    .then(data => {
      const trailSummary = data.body.trails.map(trail => {
        return new Trail(trail);
      })
      res.status(200).json(trailSummary);
    })
    .catch(err => errorHandler(err, req, res));
}

function notFoundHandler(request,response) {
  response.status(404).send('Hmmm... Something went wrong. We couldn\'t find what you are looking for.');
}

function errorHandler(err, req, res) {
  res.status(500).send(err);
}

exports.locationHandler = locationHandler;
exports.weatherHandler = weatherHandler;
exports.trailHandler = trailHandler;
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
