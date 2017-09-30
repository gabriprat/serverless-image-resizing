'use strict';

const AWS = require('aws-sdk');
const S3 = new AWS.S3({
  signatureVersion: 'v4',
});
const Sharp = require('sharp');

const BUCKET = process.env.BUCKET;
const URL = process.env.URL;
const REDIRECT_TO = process.env.REDIRECT_TO;

exports.handler = function(event, context, callback) {
  const key = event.queryStringParameters.key;
  const match = key.match(/(\d+)x(\d+)\/([\w\.]*).*/);
  const width = parseInt(match[1], 10);
  const height = parseInt(match[2], 10);
  const originalKey = match[3];
  const qs = `?r=${Math.random()}`;
  
  console.log(`KEY: ${key}`);
  console.log(`ORIGINAL KEY: ${originalKey}`);
  console.log(`QS: ${qs}`);
  S3.getObject({Bucket: BUCKET, Key: originalKey}).promise()
    .then(data => Sharp(data.Body)
      .resize(width, height)
      .max()
      .toFormat('png')
      .toBuffer()
    )
    .then(buffer => S3.putObject({
        Body: buffer,
        Bucket: BUCKET,
        ContentType: 'image/png',
        Key: `${width}x${height}/${originalKey}`,
      }).promise()
    )
    .then(() => callback(null, {
        statusCode: '301',
        headers: {'location': `${REDIRECT_TO}/${originalKey}${qs}`},
        body: '',
      })
    )
    .catch(err => callback(err))
}
