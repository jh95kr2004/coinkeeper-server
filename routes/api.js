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
var conArticleDB = DBConnection("article_db");

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
  var sql = "SELECT *, DATE_FORMAT(date, '%Y-%m-%d') AS date FROM recentdata ORDER BY UNIX_TIMESTAMP(CONCAT(date, ' ', time)) DESC LIMIT 1;";
  conPriceDB.query(sql, function(err, result, fields) {
    if(err) throw err;
    res.json(result[0]);
  });
});

router.get('/currency/:time', function(req, res, next) {
  var date = getClosestTimeByUnit(req.params.time, 5);
  var sql = "SELECT *, DATE_FORMAT(date, '%Y-%m-%d') AS date FROM recentdata WHERE UNIX_TIMESTAMP(CONCAT(date, ' ', time)) = UNIX_TIMESTAMP(CONVERT_TZ(CONCAT(?), '+00:00', '+09:00'));";
  conPriceDB.query(sql, [date.toJSON()], function(err, result, fields) {
    if(err) throw err;
    res.json(result[0]);
  });
});

router.get('/currency/:st/:en', function(req, res, next) {
  var startDate = new Date(req.params.st), endDate = new Date(req.params.en);
  var sql = "SELECT *, DATE_FORMAT(date, '%Y-%m-%d') AS date FROM recentdata WHERE UNIX_TIMESTAMP(CONCAT(date, ' ', time)) BETWEEN UNIX_TIMESTAMP(CONVERT_TZ(CONCAT(?), '+00:00', '+09:00')) AND UNIX_TIMESTAMP(CONVERT_TZ(CONCAT(?), '+00:00', '+09:00'));";
  conPriceDB.query(sql, [startDate.toJSON(), endDate.toJSON()], function(err, result, fields) {
    if(err) throw err;
    res.json(result);
  });
});

router.get('/prediction', function(req, res, next) {
  var sql = "SELECT *, DATE_FORMAT(date, '%Y-%m-%d') AS date FROM prediction ORDER BY UNIX_TIMESTAMP(CONCAT(date, '-', time)) DESC LIMIT 1;";
  conPredictionDB.query(sql, function(err, result, fields) {
    if(err) throw err;
    res.json(result[0]);
  });
});

router.get('/prediction/:time', function(req, res, next) {
  var date = getClosestTimeByUnit(req.params.time, 5);
  var sql = "SELECT *, DATE_FORMAT(date, '%Y-%m-%d') AS date FROM prediction WHERE date = '?-?-?' AND time = '?:?:00';";
  conPredictionDB.query(sql, [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()], function(err, result, fields) {
    if(err) throw err;
    res.json(result[0]);
  });
});

router.get('/prediction/:st/:en', function(req, res, next) {
  var startDate = new Date(req.params.st), endDate = new Date(req.params.en);
  var sql = "SELECT *, DATE_FORMAT(date, '%Y-%m-%d') AS date FROM prediction WHERE UNIX_TIMESTAMP(CONCAT(date, '-', time)) BETWEEN UNIX_TIMESTAMP(CONVERT_TZ(CONCAT(?), '+00:00', '+09:00')) AND UNIX_TIMESTAMP(CONVERT_TZ(CONCAT(?), '+00:00', '+09:00'));";
  conPredictionDB.query(sql, [startDate.toJSON(), endDate.toJSON()], function(err, result, fields) {
    if(err) throw err;
    res.json(result);
  });
});

router.get('/news', function(req, res, next) {
  var sql = "SELECT * FROM article ORDER BY datePublished DESC;";
  conArticleDB.query(sql, function(err, result, fields) {
    if(err) throw err;
    res.json(result);
  });
});

router.get('/account/:deviceID', function(req, res, next) {
  var sql = "SELECT * FROM userinfo WHERE deviceID = ?;";
  conUserDB.query(sql, [req.params.devideID], function(err, result, fields) {
    if(err) throw err;
    res.json(result[0]);
  });
});

router.post('/account/:deviceID', function(req, res, next) {
  var sql = "INSERT INTO userinfo (deviceID, upper, lower) VALUES(?, ?, ?) ON DUPLICATE KEY UPDATE upper = ?, lower = ?;";
  console.log(req.params.deviceID, req.body.upper, req.body.lower);
  conUserDB.query(sql, [req.params.deviceID, req.body.upper, req.body.lower, req.body.upper, req.body.lower], function(err, result, fields) {
    if(err) throw err;
  });
});

router.post('/refresh', function(req, res, next) {
});

module.exports = router;
