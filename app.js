const express = require('express');
const { DynamoDB } = require('aws-sdk');
const fs = require('fs');
const ShortUrl = require('./ShortUrl');

const dynamoDb = new DynamoDB.DocumentClient();
const homeHtml = fs.readFileSync('./index.html').toString();

// const getCorsHeaders = (event) => {
//   // List of domains that are allowed to POST to the create lambda
//   const corsWhitelist = process.env.CORS_WHITELIST.split(' ');
//
//   if (event && event.headers && event.headers.origin) {
//     const origin = event.headers.origin
//       .toLowerCase();
//     console.log(`${origin} allowed?: ${corsWhitelist.includes(origin)}`);
//     if (corsWhitelist.includes(origin)) {
//       return {
//         'Access-Control-Allow-Origin': event.headers.origin,
//         // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin
//         Vary: 'Origin',
//       };
//     }
//   }
//   return {};
// };

// https://theburningmonk.com/2017/04/aws-lambda-build-yourself-a-url-shortener-in-2-hours/
const getUniqueId = async () => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      id: '__id',
    },
    UpdateExpression: 'add #counter :n',
    ExpressionAttributeNames: {
      '#counter': 'counter',
    },
    ExpressionAttributeValues: {
      ':n': 1,
    },
    ReturnValues: 'UPDATED_NEW',
  };
  const res = await dynamoDb.update(params).promise();
  const { counter } = res.Attributes;
  return ShortUrl.encode(counter);
};

const app = express();

app.use(express.json());

app.get('/', (_req, res) => {
  res.status(200).set('Content-Type', 'text/html').send(homeHtml);
});

// TODO: prefix with v1
app.get('/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;
  if (shortUrl === 'favicon.ico') {
    return res.status(200).send();
  }
  if (shortUrl) {
    const params = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: {
        id: shortUrl,
      },
    };
    // FIXME try catch here when not found
    const record = await dynamoDb.get(params).promise();

    return res.status(302).set('Location', record.Item.url).send();
  }
  return res.status(200).send();
});

app.post('/', async (req, res) => {
  const { body } = req;
  const { url } = body;
  const id = await getUniqueId();
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      id,
      url,
      created_timestamp: Date.now(),
      created_date: new Date().toISOString(),
    },
  };
  await dynamoDb.put(params).promise();

  // FIXME CORS
  // const headers = getCorsHeaders(event);
  res.status(200).send(
    JSON.stringify(
      {
        shortUrl: `${process.env.URL}/${id}`,
      },
      null,
      2,
    ),
  );
});

module.exports = app;
