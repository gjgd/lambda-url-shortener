# URL shortener db

To deploy
```
sls deploy
```

To remove the severless db
```
sls remove
```

Note that this will not remove the DynamoDB db because of `deletionPolicy: retain`
You'll have to go in the AWS console for that
