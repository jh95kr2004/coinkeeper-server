var express = require('express');
var router = express.Router();

var mysql = require('mysql');
var con = mysql.createConnection({
  host: "coinkeeper.cyafa3gjnbdg.ap-northeast-2.rds.amazonaws.com",
  user: "coinkeeper",
  password: "coinkeeper",
  port: 3306
});

router.get('/currency', function(req, res, next) {
});

router.get('/currency/:time', function(req, res, next) {
});

router.get('/currency/:st/:en', function(req, res, next) {
});

router.get('/expectation', function(req, res, next) {
});

router.get('/expectation/:time', function(req, res, next) {
});

router.get('/expectation/:st/:en', function(req, res, next) {
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
