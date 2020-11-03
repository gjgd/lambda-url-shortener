# Lambda URL Shortener

A personal URL shortener service powered by Serverless, AWS Lambda and DynamoDB

https://tiny.gjgd.xyz/

## How to deploy your own shortener

1) Install serverless `npm i -g serverless`
2) Setup AWS credentials https://github.com/serverless/serverless/blob/master/docs/providers/aws/guide/credentials.md
3) `sls deploy`
4) Optional: Setup custom domain (see instructions below)

## Useful links

- https://theburningmonk.com/2017/04/aws-lambda-build-yourself-a-url-shortener-in-2-hours/
- https://buffer.com/library/url-shorteners/
- https://tinyurl.com/

## Custom domain with Serverless

1) Get a domain. If you didn't register through Route53, create a hosted zone in AWS console
2) Create a certificate
3) Once the certificate is verified set the domain in `serverless.yml`
4) Create domain (see commmands below) and deploy
5) Wait for DNS record to propagate (up to an hour)
6) Enjoy your short custom domain!

### Useful links

- https://www.serverless.com/blog/serverless-api-gateway-domain/
- https://github.com/amplify-education/serverless-domain-manager

### Useful commands

```bash
# Create domain
sls create_domain
# Create domain with debug info
SLS_DEBUG=* sls create_domain
# Remove domain
sls delete_domain
# Deploy
sls deploy
```
