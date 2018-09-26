const AWS = require('aws-sdk')
const axios = require('axios')
const pump = require('pump')
const Sharp = require('sharp')
const s3Stream = require('s3-upload-stream')
const sleep = require('sleep')

const addImagesToS3 = (s3Stream, bucketName, count) =>

  new Promise((resolve, reject) => {
    const axiosParams = {
      'responseType': 'stream',
      'url': 'http://picsum.photos/500/500/?random'
    }

    let i
    for (i = 0; i < count; i++) {
      if (i % 10 === 0) {
        // Let's not DoS picsum
        sleep.msleep(1500)
      }

      axios(axiosParams)
        .then(result => {
          const uploadStream = s3Stream.upload({
            Bucket: bucketName,
            Key: `picsum_${Date.now()}.jpg`
          })

          uploadStream.on('uploaded', (details) => {
            resolve()
          })

          pump(result.data, uploadStream)
        })
        .catch(error => {
          console.error(error)
        })
    }
  })

const deleteS3Object = (s3, bucketName, fileName) =>

  new Promise((resolve, reject) => {
    s3.deleteObject({
      Bucket: bucketName,
      Key: fileName
    },
    (error, data) => {
      if (error) {
        console.error(error)
        return reject(error)
      }

      console.info('success delete')

      return resolve()
    })
  })

const getS3List = (s3, bucketName) => {
  const params = { Bucket: bucketName }

  return new Promise((resolve, reject) => {
    s3.listObjects(params, (error, data) => {
      if (error) {
        console.error(error)
        return reject(error)
      }

      const isJPG = fileName => fileName.indexOf('.jpg') !== -1
      const isNotGZ = fileName => fileName.indexOf('.gz') === -1
      const isNotZip = fileName => fileName.indexOf('.zip') === -1
      const isNotResized = fileName => fileName.indexOf('_resized_') === -1

      const whitelistFile = f => isJPG(f) && isNotGZ(f) && isNotZip(f) && isNotResized(f)

      const files = data.Contents

      const images = files.filter(file => whitelistFile(file.Key))

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
    (error, data) => {
      if (error) {
        return reject(error)
      }

      const contentType = data.ContentType
      const image = data.Body

      return resolve({ fileName, image, contentType })
    })
  })

class ImageHandler {
  constructor (bucketName, key, secret) {
    const credentials = new AWS.Credentials(key, secret)

    this.s3 = new AWS.S3({ credentials })
    this.s3Stream = s3Stream(this.s3)
    this.bucketName = bucketName
  }

  addImages (count) {
    if (!count) {
      return Promise.reject(new Error('Count not specified'))
    }

    return Promise.resolve(
      addImagesToS3(this.s3Stream, this.bucketName, count)
    )
  }

  deleteImage (fileName) {
    if (!fileName) {
      return Promise.reject(new Error('Filename not specified'))
    }

    return Promise.resolve(
      deleteS3Object(this.s3, this.bucketName, fileName)
    )
  }

  fetchImage (fileName) {
    if (!fileName) {
      return Promise.reject(new Error('Filename not specified'))
    }

    return Promise.resolve(
      getS3Object(this.s3, this.bucketName, fileName)
    )
  }

  fetchImageResized (fileName, height, width) {
    if (!fileName) {
      return Promise.reject(new Error('Filename not specified'))
    }

    if (!height) {
      return Promise.reject(new Error('Height not specified'))
    }

    if (!width) {
      return Promise.reject(new Error('Width not specified'))
    }

    const fileNameParts = fileName.split('.')

    const newFileName = `${fileNameParts[0]}_resized_${height}_${width}.${fileNameParts[1]}`

    return Promise.resolve(
      getS3Object(this.s3, this.bucketName, fileName)
        .then(data =>
          Sharp(data.image)
            .resize(width, height)
            .withMetadata() // Keep all metadata
            .rotate() // Reset the orientation
            .toFormat('jpg')
            .toBuffer()
        )
        .then(buffer =>
          this.s3.putObject({
            Body: buffer,
            Bucket: this.bucketName,
            ContentType: 'image/jpeg',
            Key: newFileName
          })
            .promise()
        )
        .then(() => getS3Object(this.s3, this.bucketName, newFileName))
    )
  }

  listImages () {
    return Promise.resolve(
      getS3List(this.s3, this.bucketName)
    )
  }
}

module.exports = ImageHandler
