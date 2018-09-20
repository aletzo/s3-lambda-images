S3 + Lambda Image Handling
==========================

This is just a proof of concept of handling images using S3 + Lambda + serverless.



How to install
--------------

1. Install the required node modules:
    ```
    npm install
    ```

2. Start the app (replace AWS_BUCKET_NAME accordingly):
    ```
    BUCKET=AWS_BUCKET_NAME node app.js
    ```



How to deploy
-------------

1. Install serverless:
    ```
    npm i -g serverless
    ```

2. Configure serverless (replace AWS_KEY and AWS_SECRET accordingly):
    ```
    serverless config credentials --provider aws --key AWS_KEY --secret AWS_SECRET
    ```

3. Copy `serverless_dist.yml` to `serverless.yml` and adjust accordingly.

4. Copy `config/serverless/environment/dev_dist.yml` to `config/serverless/environment/dev.yml` and adjust accordingly.

5. Execute build node_modules in an AWS Lambda env with Docker:
    ```
    docker run --rm -v "$PWD":/var/task lambci/lambda:build-nodejs6.10
    ```

6. Execute 
    ```
    serverless deploy
    ```

7. Make sure that the environment variables (BUCKET, AWS_KEY, AWS_SECRET) exist at https://console.aws.amazon.com/lambda/home?region=YOUR_REGION#/functions/YOUR_LAMBDA_FUNCTION


Status
------

| Endpoint      | Status  | comment                                                                 |
| ------------- | ------- | ----------------------------------------------------------------------- |
| /delete-image | Done    |                                                                         |
| /fetch-image  | Done    |                                                                         |
| /list-images  | Done    |                                                                         |
| /resize-image | Pending | Sharp node package is not supported in AWS Lambda - workaround required |


Resources
---------

* https://read.acloud.guru/serverless-image-optimization-and-delivery-510b6c311fe5
* https://iiaku.com/2017/06/06/aws-lambda-part-ii-how-to-create-zip-from-files/
* https://github.com/amazon-archives/serverless-image-resizing
* https://medium.freecodecamp.org/express-js-and-aws-lambda-a-serverless-love-story-7c77ba0eaa35



