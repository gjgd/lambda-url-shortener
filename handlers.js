const { DynamoDB } = require('aws-sdk');
const fs = require('fs');
const ShortUrl = require('./ShortUrl');

const dynamoDb = new DynamoDB.DocumentClient();

const homeHtml = fs.readFileSync('./index.html').toString();

// List of domains that are allowed to POST to the create lambda
const corsWhitelist = process.env.CORS_WHITELIST.split(' ');

const getCorsHeaders = (event) => {
  if (event && event.headers && event.headers.origin) {
    const origin = event.headers.origin
      .toLowerCase();
    console.log(`${origin} allowed?: ${corsWhitelist.includes(origin)}`);
    if (corsWhitelist.includes(origin)) {
      return {
        'Access-Control-Allow-Origin': event.headers.origin,
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin
        Vary: 'Origin',
      };
    }
  }
  return {};
};

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

  const headers = getCorsHeaders(event);
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        shortUrl: `${process.env.URL}/${id}`,
      },
      null,
      2,
    ),
    headers,
  };
};
