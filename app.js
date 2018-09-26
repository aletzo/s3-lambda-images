const app = require('express')()
const bodyParser = require('body-parser')
const PORT = 3000

const ImageHandler = require('./lib/image-handler')
const ZipHandler = require('./lib/zip-handler')

app.use(bodyParser.json())

const displayStatus = () => ({
  status: `OK`
})

app.get('/add-images', (request, resolve) => {
  const count = request.query && request.query.count

  const imageHandler = new ImageHandler(
    process.env.BUCKET,
    process.env.AWS_KEY,
    process.env.AWS_SECRET
  )

  return imageHandler
    .addImages(count)
    .then(data => {
      resolve.redirect('/list-images')
    })
    .catch(error => {
      console.error(error)
      resolve.status(400).send(error.message || error)
    })
})

app.get('/delete-image', (request, resolve) => {
  const fileName = request.query && request.query.f

  const imageHandler = new ImageHandler(
    process.env.BUCKET,
    process.env.AWS_KEY,
    process.env.AWS_SECRET
  )

  return imageHandler
    .deleteImage(fileName)
    .then(data => {
      resolve.redirect('/list-images')
    })
    .catch(error => {
      console.error(error)
      resolve.status(400).send(error.message || error)
    })
})

app.get('/fetch-image', (request, resolve) => {
  const fileName = request.query && request.query.f

  const imageHandler = new ImageHandler(
    process.env.BUCKET,
    process.env.AWS_KEY,
    process.env.AWS_SECRET
  )

  return imageHandler
    .fetchImage(fileName)
    .then(data => {
      const img = Buffer.from(data.image.buffer, 'base64')

      resolve.writeHead(200, {
        'Content-Type': data.contentType
      })

      resolve.end(img)
    })
    .catch(error => {
      console.error(error)
      resolve.status(400).send(error.message || error)
    })
})

app.get('/list-images', (request, resolve) => {
  const imageHandler = new ImageHandler(
    process.env.BUCKET,
    process.env.AWS_KEY,
    process.env.AWS_SECRET
  )

  return imageHandler
    .listImages()
    .then(data => {
      let html = `
        <h1>Available Images in S3 bucket</h1>

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

      resolve.status(200).send(html)
    })
    .catch(error => {
      console.error(error)
      resolve.status(400).send(error.message || error)
    })
})

app.get('/resize-image', (request, resolve) => {
  const fileName = request.query && request.query.f
  const height = request.query && request.query.h
  const width = request.query && request.query.w

  const imageHandler = new ImageHandler(
    process.env.BUCKET,
    process.env.AWS_KEY,
    process.env.AWS_SECRET
  )

  return imageHandler
    .fetchImageResized(fileName, parseInt(height), parseInt(width))
    .then(data => {
      const img = Buffer.from(data.image, 'base64')

      resolve.writeHead(200, {
        'Content-Type': data.contentType
      })

      resolve.end(img)
    })
    .catch(error => {
      console.error(error)
      resolve.status(400).send(error.message || error)
    })
})

app.get('/status', (request, resolve) => {
  resolve.status(200).send(displayStatus())
})

app.get('/zip-image', (request, resolve) => {
  const fileName = request.query && request.query.f

  const zipHandler = new ZipHandler(
    process.env.BUCKET,
    process.env.AWS_KEY,
    process.env.AWS_SECRET
  )

  return zipHandler.zipImage(fileName)
    .then(data => {
      const zip = Buffer.from(data.zip, 'base64')

      resolve.writeHead(200, {
        'Content-Disposition': `attachment; filename="${fileName}.zip"`,
        'Content-Type': data.contentType
      })

      resolve.end(zip)
    })
    .catch(error => {
      console.error(error)
      resolve.status(400).send(error.message || error)
    })
})

app.get('/zip-images', (request, resolve) => {
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

      resolve.writeHead(200, {
        'Content-Disposition': `attachment; filename="images.zip"`,
        'Content-Type': data.contentType
      })

      resolve.end(zip)
    })
    .catch(error => {
      console.error(error)
      resolve.status(400).send(error.message || error)
    })
})

app.get('/zip', (request, resolve) => {
  resolve.status(200).send('yes ok')
})

const server = app.listen(PORT, () =>
  console.info('Listening on ' + `http://localhost:${server.address().port}`)
)
