const express = require('express');
// eslint-disable-next-line import/no-extraneous-dependencies
const { DynamoDB } = require('aws-sdk');
const { getUniqueId } = require('./utils');

const dynamoDb = new DynamoDB.DocumentClient();
const router = express.Router();

router.get('/v1/:shortUrl', async (req, res, next) => {
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

router.post('/', async (req, res, next) => {
  try {
    const { body } = req;
    const { url } = body;
    const uniqueId = await getUniqueId(dynamoDb);
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
          shortUrl: `/v1/${uniqueId}`,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;
