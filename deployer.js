var path = require('path');
var fs = require('fs');

var Qiniu = require('./qiniu');

require('colors');

// 读取 access_key 和 secret_key
// 顺序按照 ENV, account.json, config
// account.json 是 qshell 用的账户
var findKeys = function(log) {

  if (process.env.QINIU_ACCESS_KEY && process.env.QINIU_SECRET_KEY) {
    log.i('read qiniu keys from env');

    return {
      access_key: process.env.QINIU_ACCESS_KEY,
      secret_key: process.env.QINIU_SECRET_KEY,
    }
  }

  var filePath = path.join(process.env.HOME, '.qshell/account.json');
  if (fs.existsSync(filePath)) {
    var account = require(filePath);
    if (account.access_key && account.secret_key) {
      log.i('read qiniu keys from ', filePath)
      return {
        access_key: account.access_key,
        secret_key: account.secret_key,
      };
    }
  }

  return {};
}

var deploy = function(args) {
  
  var log = this.log;
  var public_dir = this.config.public_dir;

  // update keys from environment
  if (!args.access_key || !args.secret_key) {
    var account = findKeys(this.log);
    args.access_key = account.access_key;
    args.secret_key = account.secret_key;
  }

  if (!args.bucket || !args.access_key || !args.secret_key) {
    var help = '';

    help += 'You should configure deployment settings in _config.yml first!\n\n';
    help += 'Example:\n';
    help += '  deploy:\n';
    help += '    type: qiniu\n';
    help += '    bucket: <bucket>\n';
    help += '    access_key: <access_key>\n';
    help += '    secret_key: <secret_key>\n';
    help += 'Or you can use QINIU_ACCESS_KEY and QINIU_SECRET_KEY instead\n';
    help += 'For more help, you can check the docs: https://github.com/usualme/hexo-deployer-qiniu';

    console.log(help);

    return -1;
  }

  var qiniu = Qiniu.init(args.access_key, args.secret_key, args.bucket);

  /**
   * 上传文件
   */
  var upload = function (file) {
    var target = path.relative(public_dir, file);
    qiniu.upload(file, target, function (info, body) {
      console.log(file + ' uploaded.');
    });
  };

  /**
   * 上传前预先检查
   * file为本地路径(绝对路径或相对路径都可)
   * name为远程文件名
   */
  var check = function (file) {
    // var res = bucket.key(file);
    upload(file);
    // res.stat(function (err, stat) {
    //   if (err) {

    //     log.e('get file stat err: '.cyan + name + '\n' + err);
    //     return;
    //   }
    // });
  };

  /**
   * 遍历目录进行上传
   */
  var sync = function (dir) {

    var files = fs.readdirSync(dir);

    files.forEach(function (file) {
      var fileName = path.join(dir, file);
      var stat = fs.lstatSync(fileName);

      if (stat.isDirectory()) {

        sync(fileName);

      } else  {

        check(fileName);

      }
    })
  };

  return this.call('generate', {}, function() {
    sync(public_dir);
  });
};

module.exports = deploy;