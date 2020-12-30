const express = require('express');
// eslint-disable-next-line import/no-unresolved
const { DynamoDB } = require('aws-sdk');
const fs = require('fs');
const { NIL, v5: uuidv5 } = require('uuid');

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
  return String(counter);
};

const app = express();

app.use(express.json());

app.get('/', (_req, res) => {
  res.status(200).set('Content-Type', 'text/html').send(homeHtml);
});

app.get('/v1/:shortUrl', async (req, res, next) => {
  try {
    const { shortUrl } = req.params;
    const params = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: {
        id: shortUrl,
      },
    };
    const record = await dynamoDb.get(params).promise();
    if (record && record.Item) {
      res.status(302).set('Location', record.Item.url).send();
    } else {
      res.status(404).send('Url not found');
    }
  } catch (error) {
    next(error);
  }
});

app.post('/', async (req, res, next) => {
  try {
    const { body } = req;
    const { url } = body;
    const incrementalId = await getUniqueId();
    // Use a secret namespace
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
          shortUrl: `${process.env.URL}/v1/${uniqueId}`,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    next(error);
  }
});

// Error handling
app.use((err, req, res) => {
  console.error(err);
  res.status(500).send(err.message);
});

module.exports = app;
