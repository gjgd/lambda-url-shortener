const { DynamoDB } = require('aws-sdk');
const uuid = require('uuid');
const fs = require('fs');

const homeHtml = fs.readFileSync('./index.html').toString();

const dynamoDb = new DynamoDB.DocumentClient();

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

const getNewId = async () => {
  // FIXME ensure uniqueness
  // https://stackoverflow.com/questions/11721308/how-to-make-a-uuid-in-dynamodb
  // https://stackoverflow.com/questions/742013/how-do-i-create-a-url-shortener
  const id = uuid.v4();
  return id.split('-')[0];
};

module.exports.create = async (event) => {
  console.log('create');
  const body = JSON.parse(event.body);
  const { url } = body;
  const id = await getNewId();
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      id,
      url,
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
