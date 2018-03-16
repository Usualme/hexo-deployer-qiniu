var qiniu = require('qiniu');

module.exports = {
    init: function(accessKey, secretKey, bucket, zone=qiniu.zone.Zone_z2) {
        this.mac = new qiniu.auth.digest.Mac(accessKey, secretKey);

        var putPolicy = new qiniu.rs.PutPolicy({
            scope: bucket,
        });
        this.uploadToken = putPolicy.uploadToken(this.mac);

        this.config = new qiniu.conf.Config();
        this.config.zone = zone;
        this.config.useHttpsDomain = true;

        this.uploader = new qiniu.form_up.FormUploader();

        return this;
    },
    upload: function(source, target, callback) {
        var putExtra = new qiniu.form_up.PutExtra();
        putExtra.mime
        this.uploader.putFile(
            this.uploadToken,
            target,
            source,
            null,
            function(err, body, info) {
                if (err) {
                    throw err;
                }

                callback(info, body);
            }
        );
    },
};