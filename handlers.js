const { DynamoDB } = require('aws-sdk');
const fs = require('fs');
const ShortUrl = require('./ShortUrl');

const homeHtml = fs.readFileSync('./index.html').toString();

const dynamoDb = new DynamoDB.DocumentClient();

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

module.exports.home = async () => {
  console.log('home');
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
    },
    body: homeHtml,
  };
};

module.exports.redirect = async (event) => {
  console.log('redirect');
  if (event.pathParameters && event.pathParameters.shortUrl) {
    const { shortUrl } = event.pathParameters;
    const params = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: {
        id: shortUrl,
      },
    };
    const record = await dynamoDb.get(params).promise();

    return {
      statusCode: 302,
      headers: {
        Location: record.Item.url,
      },
      body: null,
    };
  }
  return {
    statusCode: 200,
  };
};

module.exports.create = async (event) => {
  console.log('create');
  const body = JSON.parse(event.body);
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

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        shortUrl: `${process.env.URL}/${id}`,
      },
      null,
      2,
    ),
  };
};
