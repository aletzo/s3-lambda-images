const archiver = require('archiver');
const AWS      = require('aws-sdk');
const fs       = require('fs');
const pump     = require('pump');
const zlib     = require('zlib');

const zipImage = (s3, s3Stream, bucketName, fileName) =>

    new Promise((res, rej) => {

        const uploadStream = s3Stream.upload({
            "Bucket": bucketName,
            "Key": `${fileName}.zip`
        });

        uploadStream.maxPartSize(1000000);
        uploadStream.concurrentParts(10);

        uploadStream.on('error', (err) => {
            rej(err);
        });

        uploadStream.on('uploaded', (details) => {
            s3.getObject({
                Bucket : bucketName,
                Key    : `${fileName}.zip`
            },
            (err, data) => {
                if (err) {
                    return rej(err);
                }

                const contentType = data.ContentType;
                const zip         = data.Body;

                return res({ fileName, zip, contentType });
            });
        });

        const image = s3.getObject({
            Bucket : bucketName,
            Key    : fileName
        });

        const archive = archiver('zip', { store: true })
            .on('error', (err) => { 
                rej(err);
            });

        archive.append(image.createReadStream(), { name: fileName });

        archive.finalize();

        pump(archive, uploadStream, (err) => {
            if (err) {
                rej(err);
            }
        });
    });

const zipImages = (images) =>

    new Promise((res, rej) => {

    });

class ZipHandler {

    constructor(bucketName, key, secret) {
        const credentials = new AWS.Credentials(key, secret);

        this.bucketName = bucketName;
        this.s3         = new AWS.S3({ credentials });
        this.s3Stream   = require('s3-upload-stream')(this.s3);
    }

    zipImages(images) {
        return Promise.resolve(
            zipImages(images)
        );
    }

    zipImage(fileName) {
        return Promise.resolve(
            zipImage(this.s3, this.s3Stream, this.bucketName, fileName)
        );
    }

}

module.exports = ZipHandler;

