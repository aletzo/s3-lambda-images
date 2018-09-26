const ImageHandler = require('./lib/image-handler')
const ZipHandler = require('./lib/zip-handler')

module.exports.addImages = (event, context, callback) => {
  const params = event.queryStringParameters
  const count = params && params.count

  const imageHandler = new ImageHandler(
    process.env.BUCKET,
    process.env.AWS_KEY,
    process.env.AWS_SECRET
  )

  return imageHandler
    .addImages(count)
    .then(data => {
      callback(null, {
        body: 'add images done!',
        headers: { 'Content-Type': 'text/html' },
        statusCode: 200
      })
    })
    .catch(error => {
      console.error('Error:', error)
      callback(null, error)
    })
}

module.exports.deleteImage = (event, context, callback) => {
  const params = event.queryStringParameters
  const fileName = params && params.f

  const imageHandler = new ImageHandler(
    process.env.BUCKET,
    process.env.AWS_KEY,
    process.env.AWS_SECRET
  )

  return imageHandler
    .deleteImage(fileName)
    .then(data => {
      callback(null, {
        body: 'delete done!',
        headers: { 'Content-Type': 'text/html' },
        statusCode: 200
      })
    })
    .catch(error => {
      console.error('Error:', error)
      callback(null, error)
    })
}

module.exports.listImages = (event, context, callback) => {
  const imageHandler = new ImageHandler(
    process.env.BUCKET,
    process.env.AWS_KEY,
    process.env.AWS_SECRET
  )

  return imageHandler
    .listImages()
    .then(data => {
      let html = `
        <h1>Available ${data.objects.length} Images in S3 bucket</h1>

        <br>
        <br>

        <a href="add-images?count=100">Add 100 more images</a>
        |
        <a href="zip-images">Zip'em all</a>

        <br>
        <br>
      `

      if (data.objects.length) {
        html += `<ol>`

        data.objects.forEach(object => {
          html += `
            <li>
                <a href="fetch-image?f=${object.Key}">${object.Key}</a>
                |
                resize: 
                <a href="resize-image?f=${object.Key}&h=100&w=100">100x100</a>
                <a href="resize-image?f=${object.Key}&h=200&w=200">200x200</a>
                <a href="resize-image?f=${object.Key}&h=1000&w=1000">1000x1000</a>
                |
                <a href="zip-image?f=${object.Key}">zip</a>
                |
                <a href="delete-image?f=${object.Key}">delete</a>
            </li>
            `
        })

        html += `</ol>`
      } else {
        html += `nope :(`
      }

      callback(null, {
        body: html,
        headers: { 'Content-Type': 'text/html' },
        statusCode: 200
      })
    })
    .catch(error => {
      console.error('Error:', error)
      callback(null, error)
    })
}

module.exports.fetchImage = (event, context, callback) => {
  const params = event.queryStringParameters
  const fileName = params && params.f

  const imageHandler = new ImageHandler(
    process.env.BUCKET,
    process.env.AWS_KEY,
    process.env.AWS_SECRET
  )

  return imageHandler
    .fetchImage(fileName)
    .then(data => {
      const img = Buffer.from(data.image.buffer, 'base64')

      callback(null, {
        statusCode: 200,
        headers: { 'Content-Type': data.contentType },
        body: img.toString('base64'),
        isBase64Encoded: true
      })
    })
    .catch(error => {
      console.error('Error:', error)
      callback(null, error)
    })
}

module.exports.resizeImage = (event, context, callback) => {
  const params = event.queryStringParameters
  const fileName = params && params.f
  const height = params && params.h
  const width = params && params.w

  const imageHandler = new ImageHandler(
    process.env.BUCKET,
    process.env.AWS_KEY,
    process.env.AWS_SECRET
  )

  return imageHandler
    .fetchImageResized(fileName, parseInt(height), parseInt(width))
    .then(data => {
      const img = Buffer.from(data.image, 'base64')

      callback(null, {
        statusCode: 200,
        headers: { 'Content-Type': data.contentType },
        body: img.toString('base64'),
        isBase64Encoded: true
      })
    })
    .catch(error => {
      console.error('Error:', error)
      callback(null, error)
    })
}

module.exports.zipImage = (event, context, callback) => {
  const params = event.queryStringParameters
  const fileName = params && params.f

  const zipHandler = new ZipHandler(process.env.BUCKET, process.env.AWS_KEY, process.env.AWS_SECRET)

  return zipHandler.zipImage(fileName)
    .then(data => {
      const zip = Buffer.from(data.zip, 'base64')

      callback(null, {
        statusCode: 200,
        headers: {
          'Content-Disposition': `attachment; filename="${fileName}.zip"`,
          'Content-Type': data.contentType
        },
        body: zip.toString('base64'),
        isBase64Encoded: true
      })
    })
    .catch(error => {
      console.error('Error:', error)
      callback(null, error)
    })
}

module.exports.zipImages = (event, context, callback) => {
  const imageHandler = new ImageHandler(
    process.env.BUCKET,
    process.env.AWS_KEY,
    process.env.AWS_SECRET
  )

  const zipHandler = new ZipHandler(
    process.env.BUCKET,
    process.env.AWS_KEY,
    process.env.AWS_SECRET
  )

  return imageHandler
    .listImages()
    .then(data => zipHandler.zipImages(data.objects))
    .then(data => {
      const zip = Buffer.from(data.zip, 'base64')

      callback(null, {
        statusCode: 200,
        headers: {
          'Content-Disposition': `attachment; filename="images.zip"`,
          'Content-Type': data.contentType
        },
        body: zip.toString('base64'),
        isBase64Encoded: true
      })
    })
    .catch(error => {
      console.error('Error:', error)
      callback(null, error)
    })
}
