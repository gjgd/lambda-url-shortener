const express = require('express');
// eslint-disable-next-line import/no-unresolved
const { DynamoDB } = require('aws-sdk');
const fs = require('fs');
const { NIL, v5: uuidv5 } = require('uuid');
const ShortUrl = require('./ShortUrl');

const dynamoDb = new DynamoDB.DocumentClient();
const homeHtml = fs.readFileSync('./index.html').toString();

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
  const incrementalId = await getUniqueId();
  const uniqueId = uuidv5(incrementalId, NIL);
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      id: uniqueId,
      url,
      created_timestamp: Date.now(),
      created_date: new Date().toISOString(),
    },
  };
  await dynamoDb.put(params).promise();

  res.status(200).send(
    JSON.stringify(
      {
        shortUrl: `${process.env.URL}/${uniqueId}`,
      },
      null,
      2,
    ),
  );
});

module.exports = app;
