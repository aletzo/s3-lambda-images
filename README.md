S3 + Lambda Image Handling
==========================

This is just a proof of concept of handling images using S3 + Lambda + serverless.



How to install for local development
------------------------------------

1. Install the required node modules:
    ```
    npm install
    ```

2. Start the app (replace `YOUR_AWS_*` accordingly):
    ```
    BUCKET=YOUR_AWS_BUCKET_NAME AWS_KEY=YOUR_AWS_KEY AWS_SECRET=YOUR_AWS_SECRET node app.js
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

5. Build node_modules using an AWS Lambda environment with Docker (some packages like Sharp require compiled files in an environment similar to AWS Lambda - by executing this command, the local version will stop working, so in order to make it work locally again you have to delete node_modules and `npm install`):
    ```
    docker run --rm -v "$PWD":/var/task lambci/lambda:build-nodejs6.10
    ```

6. Deploy: 
    ```
    serverless deploy
    ```

7. Make sure that the environment variables (`BUCKET`, `AWS_KEY` and `AWS_SECRET`) exist at https://console.aws.amazon.com/lambda/home?region=YOUR_REGION#/functions/YOUR_LAMBDA_FUNCTION



Status
------

| Endpoint      | Status  | Comment |
| ------------- | ------- | ------- |
| /add-images   | Done    |         |
| /delete-image | Done    |         |
| /fetch-image  | Done    |         |
| /list-images  | Done    |         |
| /resize-image | Done    |         |
| /zip-image    | Done    |         |
| /zip-images   | Done    |         |



Tips
----

* `sls` is a shortcut for `serverless`. So you can use `sls deploy` instead of `serverless deploy` etc.
* In case of local development, consider installing `nodemon` (`npm i -g nodemon`) to make the development process easier (using `nodemon app.js` will restart the server every time a file changes).
* When adding new routes/functions remember to create the environment variables (`BUCKET`, `AWS_KEY` and `AWS_SECRET`).



Troubleshooting
---------------

In case you face problems you can try one of the followings:

* Make sure the two config files exist and contain the correct values.
* If already deployed code stopped working right after a deploy, try to remove (`sls remove`) and re-deploy. In that case remember to create the environment variables again (`BUCKET`, `AWS_KEY` and `AWS_SECRET`).



Coding Style
------------

Just follow the default guidelines from http://standardjs.com.

If you want to automate your code formatting and be able to detect unused and deprecated code:

1. Install `standard` globally:
    ```
    npm install -g standard
    ```

2. Execute this periodically:
    ```
    standard --fix
    ```

3. Add this in the pre-commit hook:
    ```
    # Ensure all JavaScript files staged for commit pass standard code style
    function xargs-r() {
    # Portable version of "xargs -r". The -r flag is a GNU extension that
    # prevents xargs from running if there are no input files.
    if IFS= read -r -d $'\n' path; then
        { echo "$path"; cat; } | xargs $@
    fi
    }
    git diff --name-only --cached --relative | grep '\.jsx\?$' | sed 's/[^[:alnum:]]/\\&/g' | xargs-r -E '' -t standard
    if [[ $? -ne 0 ]]; then
    echo 'JavaScript Standard Style errors were detected. Aborting commit.'
    exit 1
    fi
    ```



Resources
---------

* https://read.acloud.guru/serverless-image-optimization-and-delivery-510b6c311fe5
* https://iiaku.com/2017/06/06/aws-lambda-part-ii-how-to-create-zip-from-files/
* https://github.com/iiAku/zip-aws-lambda
* https://github.com/amazon-archives/serverless-image-resizing
* https://medium.freecodecamp.org/express-js-and-aws-lambda-a-serverless-love-story-7c77ba0eaa35



