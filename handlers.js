const { DynamoDB } = require('aws-sdk');
const uuid = require('uuid');
const fs = require('fs');
const retry = require('async-retry');

const homeHtml = fs.readFileSync('./index.html').toString();

const dynamoDb = new DynamoDB.DocumentClient();

// eslint-disable-next-line arrow-body-style
const getUniqueId = async () => {
  // Retry 3 times in case of collision, then return error
  return retry(
    async (bail) => {
      // FIXME ensure uniqueness
      // https://stackoverflow.com/questions/11721308/how-to-make-a-uuid-in-dynamodb
      // https://stackoverflow.com/questions/742013/how-do-i-create-a-url-shortener
      const id = uuid.v4().split('-')[0];
      const params = {
        TableName: process.env.DYNAMODB_TABLE,
        Key: {
          id,
        },
      };
      const record = await dynamoDb.get(params).promise();
      if (record.Item) {
        const errorText = `${id} has a collision with record ${JSON.stringify(
          record,
          null,
          2,
        )}`;
        console.error(errorText);
        return bail(new Error(errorText));
      }
      return id;
    },
    {
      retries: 3,
    },
  );
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
