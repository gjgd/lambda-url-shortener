# Lambda URL Shortener

A personal URL shortener service powered by Serverless Components, AWS Lambda and DynamoDB

Prod: https://tiny.gjgd.xyz/
Dev: https://dev-tiny.gjgd.xyz/

## How to deploy your own shortener

1) Install serverless `npm i -g serverless`
2) Setup AWS credentials https://github.com/serverless/serverless/blob/master/docs/providers/aws/guide/credentials.md
3) `npm install`
4) `npm run deploy:dev` or `npm run deploy:prod`
5) Optional: Set the `domain` property if you have a domain setup on Route53, otherwise you can remove this property
