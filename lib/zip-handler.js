const archiver = require('archiver')
const AWS = require('aws-sdk')
const pump = require('pump')
const s3Stream = require('s3-upload-stream')

const gerenateZip = (s3, s3Stream, bucketName, fileNames) =>

  new Promise((resolve, reject) => {
    const zipName = fileNames.length > 1 ? 'images' : fileNames[0]

    const zipParams = {
      Bucket: bucketName,
      Key: `${zipName}.zip`
    }

    const uploadStream = s3Stream.upload(zipParams)

    uploadStream.maxPartSize(1000000)
    uploadStream.concurrentParts(10)

    uploadStream.on('error', (error) => {
      reject(error)
    })

    uploadStream.on('uploaded', (details) => {
      s3.getObject(zipParams, (error, data) => {
        if (error) {
          return reject(error)
        }

        const contentType = data.ContentType
        const zip = data.Body

        resolve({ fileName: zipName, zip, contentType })
      })
    })

    const archive = archiver('zip')
      .on('error', (error) => {
        reject(error)
      })

    fileNames.forEach(fileName => {
      const image = s3.getObject({
        Bucket: bucketName,
        Key: fileName
      })

      archive.append(image.createReadStream(), { name: fileName })
    })

    archive.finalize()

    pump(archive, uploadStream, (error) => {
      if (error) {
        reject(error)
      }
    })
  })

const zipImage = (s3, s3Stream, bucketName, fileName) =>

  new Promise((resolve, reject) =>
    resolve(gerenateZip(s3, s3Stream, bucketName, [fileName]))
  )

const zipImages = (s3, s3Stream, bucketName, images) =>

  new Promise((resolve, reject) => {
    const fileNames = images.map(image => image.Key)

    resolve(gerenateZip(s3, s3Stream, bucketName, fileNames))
  })

class ZipHandler {
  constructor (bucketName, key, secret) {
    const credentials = new AWS.Credentials(key, secret)

    this.bucketName = bucketName
    this.s3 = new AWS.S3({ credentials })
    this.s3Stream = s3Stream(this.s3)
  }

  zipImage (fileName) {
    return Promise.resolve(
      zipImage(this.s3, this.s3Stream, this.bucketName, fileName, fileName)
    )
  }

  zipImages (images) {
    return Promise.resolve(
      zipImages(this.s3, this.s3Stream, this.bucketName, images, 'images')
    )
  }
}

module.exports = ZipHandler
