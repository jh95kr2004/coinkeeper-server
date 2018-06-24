var express = require('express');
var router = express.Router();

var mysql = require('mysql');
var admin = require('firebase-admin');

var serviceAccount = require('../coinkeeper-b735f-firebase-adminsdk-9sm8f-6fdc38254e.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://coinkeeper-b735f.firebaseio.com"
});

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
  conUserDB.query(sql, [req.params.deviceID], function(err, result, fields) {
    if(err) throw err;
    res.json(result[0]);
  });
});

router.post('/account/:deviceID', function(req, res, next) {
  var sql = "INSERT INTO userinfo (deviceID, upper, lower) VALUES(?, ?, ?) ON DUPLICATE KEY UPDATE upper = ?, lower = ?;";
  conUserDB.query(sql, [req.params.deviceID, req.body.upper, req.body.lower, req.body.upper, req.body.lower], function(err, result, fields) {
    if(err) throw err;
    res.send("123");
  });
});

function sendPushNotification(registrationTokens, title, body) {
  var payload = {
    notification: {
      title: title,
      body: body
    }
  };

  admin.messaging().sendToDevice(registrationTokens, payload)
    .then((response) => {
      console.log('Successfully sent message:', response);
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });
}

router.get('/pushTest', function(req, res, next) {
  var sql = "SELECT deviceID FROM userinfo;"
    conUserDB.query(sql, function(err, users, fields) {
      var tokens = [];
      for(let user of users) tokens.push(user["deviceID"]);
      sendPushNotification(tokens, "Push test", "푸시 알람 테스트입니다.");
      res.send("done");
  });
});

router.get('/refresh', function(req, res, next) {
  var sql = "SELECT *, DATE_FORMAT(date, '%Y-%m-%d') AS date FROM recentdata ORDER BY UNIX_TIMESTAMP(CONCAT(date, ' ', time)) DESC LIMIT 2;";
  conPriceDB.query(sql, function(err, prices, fields) {
    var prevPrice = prices[1]["price_krw"], curPrice = prices[0]["price_krw"];
    var sql = "SELECT * FROM userinfo;"
      conUserDB.query(sql, function(err, users, fields) {
      for(let user of users) {
        if(prevPrice < user["upper"] && user["upper"] <= curPrice)
          sendPushNotification(user["deviceID"], "시세 도달", "시세가 상승하여 설정값에 도달하였습니다.");
        if(curPrice >= user["lower"] && user["lower"] > prevPrice)
          sendPushNotification(user["deviceID"], "시세 도달", "시세가 하락하여 설정값에 도달하였습니다.");
      }
    });
  });
  res.send("Refresh is done");
});

router.get('/refreshPrediction', function(req, res, next) {
  var sql = "SELECT *, DATE_FORMAT(date, '%Y-%m-%d') AS date FROM prediction ORDER BY UNIX_TIMESTAMP(CONCAT(date, '-', time)) DESC LIMIT 1;";
  conPredictionDB.query(sql, function(err, prediction, fields) {
    if(prediction[0]["label_0"] != -2 && prediction[0]["label_0"] != 2) {
      var sql = "SELECT deviceID FROM userinfo;"
        conUserDB.query(sql, function(err, users, fields) {
          var tokens = [];
          for(let user of users) tokens.push(user["deviceID"]);
          if(prediction[0]["label_0"] == -2)
            sendPushNotification(tokens, "시세 급등", "시세 급등이 관측되었습니다.");
          else if(prediction[0]["label_0"] == 2)
            sendPushNotification(tokens, "시세 급락", "시세 급락이 관측되었습니다.");
      });
    }
  });
  res.send("Refresh prediction is done");
});

module.exports = router;
