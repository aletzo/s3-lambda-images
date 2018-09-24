const ImageHandler = require('./lib/image-handler');
const ZipHandler   = require('./lib/zip-handler');

module.exports.deleteImage = (event, context, callback) => {
    const params   = event.queryStringParameters;
    const fileName = params && params.f;

    const imageHandler = new ImageHandler(process.env.BUCKET, process.env.AWS_KEY, process.env.AWS_SECRET);

    return imageHandler
        .deleteImage(fileName)
        .then(data => {
            callback(null, {
                body: 'delete done!',
                headers: { 'Content-Type': 'text/html' },
                statusCode: 200,
            });
        })
        .catch(error => {
            console.error('Error:', error);
            callback(null, error);
        });
}

module.exports.listImages = (event, context, callback) => {
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
                            <a href="zip-image?f=${object.Key}">delete</a>
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

            callback(null, {
                body: html,
                headers: { 'Content-Type': 'text/html' },
                statusCode: 200,
            });
        })
        .catch(error => {
            console.error('Error:', error);
            callback(null, error);
        });
}

module.exports.fetchImage = (event, context, callback) => {
    const params   = event.queryStringParameters;
    const fileName = params && params.f;

    const imageHandler = new ImageHandler(process.env.BUCKET, process.env.AWS_KEY, process.env.AWS_SECRET);

    return imageHandler
        .fetchImage(fileName)
        .then(data => {
            const img = new Buffer(data.image.buffer, 'base64');

            callback(null, {
                statusCode: 200,
                headers: { 'Content-Type': data.contentType },
                body: img.toString('base64'),
                isBase64Encoded: true,
            });
        })
        .catch(error => {
            console.error('Error:', error);
            callback(null, error);
        });
}

module.exports.resizeImage = (event, context, callback) => {
    const params   = event.queryStringParameters;
    const fileName = params && params.f;
    const height   = params && params.h;
    const width    = params && params.w;

    const imageHandler = new ImageHandler(process.env.BUCKET, process.env.AWS_KEY, process.env.AWS_SECRET);

    return imageHandler
        .fetchImageResized(fileName, parseInt(height), parseInt(width))
        .then(data => {
            const img = new Buffer(data.image, 'base64');

            callback(null, {
                statusCode: 200,
                headers: { 'Content-Type': data.contentType },
                body: img.toString('base64'),
                isBase64Encoded: true,
            });
        })
        .catch(error => {
            console.error('Error:', error);
            callback(null, error);
        });
}

module.exports.zipImage = (event, context, callback) => {
    const params   = event.queryStringParameters;
    const fileName = params && params.f;

    const zipHandler = new ZipHandler(process.env.BUCKET, process.env.AWS_KEY, process.env.AWS_SECRET);

    return zipHandler.zipImage(fileName)
        .then(data => {
            const zip = new Buffer(data.zip, 'base64');

            callback(null, {
                statusCode: 200,
                headers: { 
                    'Content-Disposition' : `attachment; filename="${fileName}.zip"`,
                    'Content-Type'        : data.contentType 
                },
                body: zip.toString('base64'),
                isBase64Encoded: true,
            });
        })
        .catch(error => {
            console.error('Error:', error);
            callback(null, error);
        });
}

module.exports.zipImages = (event, context, callback) => {
    const imageHandler = new ImageHandler(process.env.BUCKET, process.env.AWS_KEY, process.env.AWS_SECRET);
    const zipHandler   = new ZipHandler  (process.env.BUCKET, process.env.AWS_KEY, process.env.AWS_SECRET);

    const images = imageHandler.listImages();

    return zipHandler
        .zipImages(images)
        .then(data => {
            const zip = new Buffer(data.zip, 'base64');

            callback(null, {
                statusCode: 200,
                headers: { 'Content-Type': data.contentType },
                body: zip.toString('base64'),
                isBase64Encoded: true,
            });
        })
        .catch(error => {
            console.error('Error:', error);
            callback(null, error);
        });
}
