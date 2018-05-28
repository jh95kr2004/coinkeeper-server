var express = require('express');
var router = express.Router();

var mysql = require('mysql');

function DBConnection(dbname) {
  return mysql.createConnection({
    host: "coinkeeper.cyafa3gjnbdg.ap-northeast-2.rds.amazonaws.com",
    user: "coinkeeper",
    password: "coinkeeper",
    database: dbname,
    port: 3306
  });
}

var conPriceDB = DBConnection("price_db");
var conPredictionDB = DBConnection("prediction_db");
var conUserDB = DBConnection("user_db");

function getClosestTimeByUnit(time, unit) {
  var date = new Date(time), leftDate = new Date(time), rightDate = new Date(time);
  leftDate.setMinutes(leftDate.getMinutes() - leftDate.getMinutes() % unit);
  leftDate.setSeconds(0);
  rightDate.setMinutes(rightDate.getMinutes() + unit - rightDate.getMinutes() % unit);
  rightDate.setSeconds(0);
  if(date.getTime() - leftDate.getTime() < rightDate.getTime() - date.getTime()) return leftDate;
  return rightDate;
}

router.get('/currency', function(req, res, next) {
  var sql = "SELECT * FROM recentdata ORDER BY year DESC, month DESC, date DESC, hour DESC, min DESC LIMIT 1;";
  conPriceDB.query(sql, function(err, result, fields) {
    if(err) throw err;
    res.json(result[0]);
  });
});

router.get('/currency/:time', function(req, res, next) {
  var date = getClosestTimeByUnit(req.params.time, 5);
  var sql = "SELECT * FROM recentdata WHERE year = ? AND month = ? AND date = ? AND hour = ? AND min = ?;";
  conPriceDB.query(sql, [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()], function(err, result, fields) {
    if(err) throw err;
    res.json(result[0]);
  });
});

router.get('/currency/:st/:en', function(req, res, next) {
  var startDate = new Date(req.params.st), endDate = new Date(req.params.en);
  var sql = "SELECT * FROM recentdata WHERE UNIX_TIMESTAMP(CONCAT(year, '-', month, '-', date, ' ', hour, ':', min, ':', '00')) BETWEEN UNIX_TIMESTAMP(CONCAT(?, '-', ?, '-', ?, ' ', ?, ':', ?, ':', ?)) AND UNIX_TIMESTAMP(CONCAT(?, '-', ?, '-', ?, ' ', ?, ':', ?, ':', ?));";
  conPriceDB.query(sql, [startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate(), startDate.getHours(), startDate.getMinutes(), startDate.getSeconds(), endDate.getFullYear(), endDate.getMonth() + 1, endDate.getDate(), endDate.getHours(), endDate.getMinutes(), endDate.getSeconds()], function(err, result, fields) {
    if(err) throw err;
    res.json(result);
  });
});

router.get('/prediction', function(req, res, next) {
  var sql = "SELECT * FROM prediction ORDER BY year DESC, month DESC, date DESC, hour DESC, min DESC LIMIT 1;";
  conPredictionDB.query(sql, function(err, result, fields) {
    if(err) throw err;
    res.json(result[0]);
  });
});

router.get('/prediction/:time', function(req, res, next) {
  var date = getClosestTimeByUnit(req.params.time, 5);
  var sql = "SELECT * FROM prediction WHERE year = ? AND month = ? AND date = ? AND hour = ? AND min = ?;";
  conPredictionDB.query(sql, [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()], function(err, result, fields) {
    if(err) throw err;
    res.json(result[0]);
  });
});

router.get('/prediction/:st/:en', function(req, res, next) {
  var startDate = new Date(req.params.st), endDate = new Date(req.params.en);
  var sql = "SELECT * FROM prediction WHERE UNIX_TIMESTAMP(CONCAT(year, '-', month, '-', date, ' ', hour, ':', min, ':', '00')) BETWEEN UNIX_TIMESTAMP(CONCAT(?, '-', ?, '-', ?, ' ', ?, ':', ?, ':', ?)) AND UNIX_TIMESTAMP(CONCAT(?, '-', ?, '-', ?, ' ', ?, ':', ?, ':', ?));";
  conPredictionDB.query(sql, [startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate(), startDate.getHours(), startDate.getMinutes(), startDate.getSeconds(), endDate.getFullYear(), endDate.getMonth() + 1, endDate.getDate(), endDate.getHours(), endDate.getMinutes(), endDate.getSeconds()], function(err, result, fields) {
    if(err) throw err;
    res.json(result);
  });
});

router.get('/news', function(req, res, next) {
});

router.get('/news/:st/:en', function(req, res, next) {
});

router.get('/account/:deviceID/', function(req, res, next) {
});

router.post('/account/:deviceID/:currency', function(req, res, next) {
});

module.exports = router;
