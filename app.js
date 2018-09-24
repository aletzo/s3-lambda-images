const app = require('express')();
const bodyParser = require('body-parser');
const PORT = 3000;

const ImageHandler = require('./lib/image-handler');
const ZipHandler   = require('./lib/zip-handler');

app.use(bodyParser.json());

const displayStatus = () => ({
    status: `OK`,
});

app.get('/delete-image', (req, res) => {
    const imageHandler = new ImageHandler(process.env.BUCKET, process.env.AWS_KEY, process.env.AWS_SECRET);
    const fileName = req.query && req.query.f;

    return imageHandler
        .deleteImage(fileName)
        .then(data => {
            res.redirect('/list-images')
        })
        .catch(error => {
            console.error(error);
            res.status(400).send(error.message || error);
        });
});

app.get('/fetch-image', (req, res) => {
    const imageHandler = new ImageHandler(process.env.BUCKET, process.env.AWS_KEY, process.env.AWS_SECRET);
    const fileName = req.query && req.query.f;

    return imageHandler
        .fetchImage(fileName)
        .then(data => {
            const img = new Buffer(data.image.buffer, 'base64');

            res.writeHead(200, {
                'Content-Type': data.contentType
            });

            res.end(img);
        })
        .catch(error => {
            console.error(error);
            res.status(400).send(error.message || error);
        });
});

app.get('/list-images', (req, res) => {
    const imageHandler = new ImageHandler(process.env.BUCKET, process.env.AWS_KEY, process.env.AWS_SECRET);

    return imageHandler
        .listImages()
        .then(data => {
            let html = `
                <h1>Available Images in S3 bucket</h1>

                <br>
                <br>
            `;

            if (data.objects.length) {
                html +=  `<ul>`;

                data.objects.forEach(object => {
                    html += `
                        <li>
                            <a href="fetch-image?f=${object.Key}">${object.Key}</a>
                            resize: 
                            <a href="resize-image?f=${object.Key}&h=100&w=100">100x100</a>
                            <a href="resize-image?f=${object.Key}&h=200&w=200">200x200</a>
                            <a href="resize-image?f=${object.Key}&h=1000&w=1000">1000x1000</a>
                            <a href="zip-image?f=${object.Key}">zip</a>
                            <a href="delete-image?f=${object.Key}">delete</a>
                        </li>
                    `;
                    }
                );

                html += `</ul>`;

                html += `
                    <br>
                    <br>

                    <a href="zip-images">Zip them!</a>
                    `;
            } else {
                html +=  `nope :(`;
            }

            res.status(200).send(html);
        })
        .catch(error => {
            console.error(error);
            res.status(400).send(error.message || error);
        });
});

app.get('/resize-image', (req, res) => {
    const imageHandler = new ImageHandler(process.env.BUCKET, process.env.AWS_KEY, process.env.AWS_SECRET);
    const fileName = req.query && req.query.f;
    const height   = req.query && req.query.h;
    const width    = req.query && req.query.w;

    return imageHandler
        .fetchImageResized(fileName, parseInt(height), parseInt(width))
        .then(data => {
            const img = new Buffer(data.image, 'base64');

            res.writeHead(200, {
                'Content-Type': data.contentType
            });

            res.end(img);
        })
        .catch(error => {
            console.error(error);
            res.status(400).send(error.message || error);
        });
});


app.get('/status', (req, res) => {
    res.status(200).send(displayStatus());
});

app.get('/zip-image', (req, res) => {
    const fileName = req.query && req.query.f;

    const zipHandler = new ZipHandler(process.env.BUCKET, process.env.AWS_KEY, process.env.AWS_SECRET);

    return zipHandler.zipImage(fileName)
        .then(data => {
            const zip = new Buffer(data.zip, 'base64');

            res.writeHead(200, {
                'Content-Disposition' : `attachment; filename="${fileName}.zip"`,
                'Content-Type'        : data.contentType
            });

            res.end(zip);
        })
        .catch(error => {
            console.error(error);
            res.status(400).send(error.message || error);
        });
});

app.get('/zip', (req, res) => {
    res.status(200).send('yes ok');
});

const server = app.listen(PORT, () =>
    console.info('Listening on ' + `http://localhost:${server.address().port}`)
);
