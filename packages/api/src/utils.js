const { NIL, v5: uuidv5 } = require('uuid');

// https://theburningmonk.com/2017/04/aws-lambda-build-yourself-a-url-shortener-in-2-hours/
const getUniqueId = async (dynamoDb) => {
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
  const namespace = process.env.SECRET_UUID_NAMESPACE || NIL;
  const uniqueId = uuidv5(String(counter), namespace);
  return uniqueId;
};

module.exports = {
  getUniqueId,
};
