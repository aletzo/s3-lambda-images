const AWS = require('aws-sdk')
const axios = require('axios')
const fs = require('fs')
const Sharp = require('sharp')

const addImagesToS3 = (s3, bucketName, count) =>

  new Promise((resolve, reject) => {
  /*
    s3.putObject({
      Body: buffer,
      Bucket: bucketName,
      ContentType: 'image/jpeg',
      Key: newFileName
    })
      .promise()
      */
  })

const deleteS3Object = (s3, bucketName, fileName) =>

  new Promise((resolve, reject) => {
    s3.deleteObject({
      Bucket: bucketName,
      Key: fileName
    },
    (err, data) => {
      if (err) {
        console.error(err)
        return reject(err)
      }

      console.info('success delete')

      return resolve()
    })
  })

const downloadImage = (url, imagePath) =>
  axios({ 'url': url, 'responseType': 'stream' })
    .then(response => {
      response.data.pipe(fs.createWriteStream(imagePath))

      return { 'status': true, 'error': '' }
    })
    .catch(err => {
      console.error(err)

      return {
        'error': 'Error: ' + error.message,
        'status': false
      }
    })

const getS3List = (s3, bucketName) => {
  const params = { Bucket: bucketName }

  return new Promise((resolve, reject) => {
    s3.listObjects(params, (err, data) => {
      if (err) {
        console.error(err)
        return reject(err)
      }

      const files = data.Contents
      const images = files.filter(file => file.Key.indexOf('jpg') !== -1)
        .filter(file => file.Key.indexOf('.gz') === -1)
        .filter(file => file.Key.indexOf('.zip') === -1)
        .filter(file => file.Key.indexOf('_resized_') === -1)

      return resolve({ objects: images })
    })
  })
}

const getS3Object = (s3, bucketName, fileName) =>

  new Promise((resolve, reject) => {
    s3.getObject({
      Bucket: bucketName,
      Key: fileName
    },
    (err, data) => {
      if (err) {
        return reject(err)
      }

      const contentType = data.ContentType
      const image = data.Body

      return resolve({ fileName, image, contentType })
    })
  })

class ImageHandler {
  constructor (bucketName, key, secret) {
    const credentials = new AWS.Credentials(key, secret)

    this.S3 = new AWS.S3({ credentials })
    this.bucketName = bucketName
  }

  addImages (count) {
    if (!count) {
      return Promise.reject('Count not specified')
    }

    return Promise.resolve(
      addImagesToS3(this.S3, this.bucketName, count)
    )
  }

  deleteImage (fileName) {
    if (!fileName) {
      return Promise.reject('Filename not specified')
    }

    return Promise.resolve(
      deleteS3Object(this.S3, this.bucketName, fileName)
    )
  }

  fetchImage (fileName) {
    if (!fileName) {
      return Promise.reject('Filename not specified')
    }

    return Promise.resolve(
      getS3Object(this.S3, this.bucketName, fileName)
    )
  }

  fetchImageResized (fileName, height, width) {
    if (!fileName) {
      return Promise.reject('Filename not specified')
    }

    if (!height) {
      return Promise.reject('Height not specified')
    }

    if (!width) {
      return Promise.reject('Width not specified')
    }

    const fileNameParts = fileName.split('.')

    const newFileName = `${fileNameParts[0]}_resized_${height}_${width}.${fileNameParts[1]}`

    return Promise.resolve(
      getS3Object(this.S3, this.bucketName, fileName)
        .then(data =>
          Sharp(data.image)
            .resize(width, height)
            .toFormat('jpg')
            .toBuffer()
        )
        .then(buffer =>
          this.S3.putObject({
            Body: buffer,
            Bucket: this.bucketName,
            ContentType: 'image/jpeg',
            Key: newFileName
          })
            .promise()
        )
        .then(() => getS3Object(this.S3, this.bucketName, newFileName))
    )
  }

  listImages () {
    return Promise.resolve(
      getS3List(this.S3, this.bucketName)
    )
  }
}

module.exports = ImageHandler
