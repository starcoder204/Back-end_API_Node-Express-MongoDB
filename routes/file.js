var express = require('express');
var router = express.Router();
var multer = require('multer');
var fs = require('fs');
var config = require('../config');
var _resultCode = config.result_code;
var _displayResults = config._displayResults;
var menufile = 'menu.json';

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    var accountId = req.oauth_decoded.pos_client_id;
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }
    var dir = 'uploads/' + accountId;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    var filename = req.params.filename;
    if (filename === undefined) {
      filename = menufile;
    }
    console.log(file);
    // var type = path.extname(file.originalname);
    cb(null, filename);
  }
});
var maxSize = config.upload_file_max_size;
var upload = multer({ storage: storage, limits: { fileSize: maxSize } });

/** ************************ file uplaod and download route *************************/
/* file upload : POST */
router.post('/files/:filename', upload.single('file'), function (req, res) {
  if (req.file) {
    res.json(_displayResults(_resultCode.FILE_UPLOAD_SUCCESS, 'Successfully uploaded', true));
  } else {
    res.status(405).json(_displayResults(_resultCode.NO_SELECTED_UPLOAD_FILE, "Please select file(key='file') to upload"));
  }
});

/* file download : GET */
router.get('/files/:filename', function (req, res) {
  var accountId = req.oauth_decoded.pos_client_id;
  var filename = req.params.filename;
  var file = 'uploads/' + accountId + '/' + filename;
  console.log('file', file);
  if (!fs.existsSync(file)) {
    return res.json(_displayResults(_resultCode.NO_SUCH_FILE, 'No such file'));
  }
  res.download(file, function (err) {
    console.log('err', err);
    // if (err !== undefined) {
    //   return res.json(_displayResults(_resultCode.NO_SUCH_FILE, err));
    // }
    res.end();
  }); // Set disposition and send it.
});

/* get file list of accountId : GET */
router.get('/files', function (req, res) {
  var accountId = req.oauth_decoded.pos_client_id;
  var dir = 'uploads/' + accountId;
  var filelist = [];
  if (!fs.existsSync(dir)) {
    res.json(_displayResults(_resultCode.FILE_LIST_SUCCESS, filelist));
  } else {
    fs.readdir(dir, (_err, files) => {
      files.forEach(file => {
        filelist.push(file);
      });
      res.json(_displayResults(_resultCode.FILE_LIST_SUCCESS, filelist));
    });
  }
});

/** ************************ menu route *************************/
/* menu.json file upload : POST */
router.post('/menu', function (req, res) {
  var menu = req.body;
  if (isEmpty(menu)) {
    res.status(405).json(_displayResults(_resultCode.NO_SELECTED_UPLOAD_FILE, 'Invalid input'));
    return;
  }
  var accountId = req.oauth_decoded.pos_client_id;
  var fileDir = 'uploads/' + accountId + '/' + menufile;
  fs.writeFile(fileDir, JSON.stringify(menu), function (_err) {
    if (_err) {
      console.log('An error occured while writing JSON Object to File.');
      res.status(201).json(_displayResults(_resultCode.ERROR_IN_FILE, _err));
      return;
    }
    res.json(_displayResults(_resultCode.FILE_UPLOAD_SUCCESS, 'Successfully saved', true));
  });
});

/* menu.json file download : GET */
router.get('/menu', function (req, res) {
  var accountId = req.oauth_decoded.pos_client_id;
  var filename = menufile;
  var file = 'uploads/' + accountId + '/' + filename;
  console.log('file', file);
  if (!fs.existsSync(file)) {
    return res.json(_displayResults(_resultCode.NO_SUCH_FILE, 'No such file'));
  }
  res.download(file, function (err) {
    console.log('err', err);
    // if (err !== undefined) {
    //   return res.json(_displayResults(_resultCode.NO_SUCH_FILE, err));
    // }
    res.end();
  }); // Set disposition and send it.
});

// check if obj is empty or not
function isEmpty (obj) {
  if (typeof (obj) === 'string') {
    return false;
  }
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
}

module.exports = router;
