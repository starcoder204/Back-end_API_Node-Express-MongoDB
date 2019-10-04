var express = require('express');
// var fetch = require('node-fetch');
// var FormData = require('form-data');
var jwt = require('jsonwebtoken');
var md5 = require('js-md5');
var uniqid = require('uniqid');
var router = express.Router();
var db = require('../db');
var config = require('../config');
var _resultCode = config.result_code;
var _displayResults = config._displayResults;

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'User' });
});

/* Create user account : POST */
router.post('/users/signup', function (req, res, next) {
  var email = req.body.email;
  if (email === undefined) {
    res.status(405).json(_displayResults(_resultCode.EMAIL_UNDEFINED, 'Email(email) is undefined'));
    return;
  }
  var password = req.body.password;
  if (password === undefined) {
    res.status(405).json(_displayResults(_resultCode.PASSWORD_UNDEFINED, 'Password(password) is undefined'));
    return;
  }
  var name = req.body.name;
  if (name === undefined) {
    res.status(405).json(_displayResults(_resultCode.NAME_UNDEFINED, 'Name(name) is undefined'));
    return;
  }
  var cellnumber = req.body.cellnumber;
  if (cellnumber === undefined) {
    res.status(405).json(_displayResults(_resultCode.CELLNUMBER_UNDEFINED, 'Phone number(cellnumber) is undefined'));
    return;
  }
  var collection = db.get().collection(config.userCollection);
  var query = { 'email': email };
  collection.find(query).toArray(function (_err, docs) {
    if (docs.length === 0) {
      query = { 'user_id': uniqid.time(), 'email': email, 'password': md5(password), 'name': name, 'cellnumber': cellnumber };
      collection.insertOne(query, function (_err, inserted) {
        res.json(_displayResults(_resultCode.USER_CREATED_SUCCESS, 'Successfully created', true));
      });
    } else {
      res.status(201).json(_displayResults(_resultCode.EMAIL_ALREADY_EXIST, 'This email already exist'));
    }
  });
});

/* User login : POST */
router.post('/users/login', function (req, res, next) {
  var email = req.body.email;
  if (email === undefined) {
    res.status(405).json(_displayResults(_resultCode.EMAIL_UNDEFINED, 'Email(email) is undefined'));
    return;
  }
  var password = req.body.password;
  if (password === undefined) {
    res.status(405).json(_displayResults(_resultCode.PASSWORD_UNDEFINED, 'Password(password) is undefined'));
    return;
  }
  var collection = db.get().collection(config.userCollection);
  var query = { 'email': email };
  collection.find(query).toArray(function (_err, docs) {
    if (docs.length === 0) {
      res.status(201).json(_displayResults(_resultCode.LOGIN_EMAIL_INVALID, 'No user of this email. Please create new account'));
    } else {
      query = { 'email': email, 'password': md5(password) };
      collection.find(query).toArray(function (_err, docs) {
        if (docs.length === 0) {
          res.status(201).json(_displayResults(_resultCode.LOGIN_PASSWORD_INVALID, 'Password is incorrect'));
        } else {
          // if eveything is okey let's create our token
          var userId = docs[0]['user_id'];
          const payload = {
            audience: config.user_token.audience,
            issuer: config.user_token.issuer,
            subject: userId,
            notBefore: (new Date()).toISOString()
          };
          var key = config.secret_key;
          var token = jwt.sign(payload, key, {
            expiresIn: 3600 // expires in 1 hour
          });
          var result = {
            message: 'user authentication done',
            token: token
          };
          res.json(_displayResults(_resultCode.LOGIN_SUCCESS, result, true));

          // var obj = config.params_to_get_new_access_token;
          // let form_data = new FormData();
          // for (let key in obj) {
          //   form_data.append(key, obj[key]);
          // }
          // (async () => {
          //   const rawResponse = await fetch(config.token_endpoint, {
          //     method: 'POST',
          //     body: form_data
          //   });
          //   const result = await rawResponse.json();
          //   if(result.access_token){
          //     res.json(_displayResults(_resultCode.LOGIN_SUCCESS, result));
          //   } else{
          //     res.json(_displayResults(_resultCode.LOGIN_GET_TOKEN_ERROR, result));
          //   }
          // })();
        }
      });
    }
  });
});

module.exports = router;
