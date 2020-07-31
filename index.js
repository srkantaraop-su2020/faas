const aws = require("aws-sdk");

aws.config.update({region: 'us-east-1'});
var ses = new aws.SES();
var dynamoDB = new aws.DynamoDB({ apiVersion: '2012-08-10' });

exports.handler = function (event, context, callback) {
    console.log(event.Records[0].Sns);

    let message = event.Records[0].Sns.Message;
    let messageDataJson = JSON.parse(JSON.parse(message).data);

    let email = messageDataJson.Email;
    let token = messageDataJson.Token;

    let currentTime = new Date().getTime();
    let ttl = 15 * 60 * 1000;
    let expirationTime = (currentTime + ttl).toString();

    var emailParams = {
        Destination: {
            ToAddresses: [
                email
            ]
        },
        Message: {
            Body: {
                Html: {
                    Data: `<html><head><title>Your Token</title><style>h1{color:#f00;}</style></head><body><h1>Hello,</h1><div>Your Password Reset Token is ${token}</div></body></html>`
                }
            },
            Subject: {
                Charset: "UTF-8",
                Data: " Password Reset Link"
            }
        },
        Source: "passwordreset@prod.pavan.website"
    };

    let putParams = {
        TableName: "csye6225",
        Item: {
            id: { S: email },
            ttl: { N: expirationTime },
            token: { S: token}
        }
    };
    let queryParams = {
        TableName: 'csye6225',
        Key: {
            'id': { S: email }
        },
    };

    
    dynamoDB.getItem(queryParams, (err, data) => {

        if (err) {
            console.log(err);
        } else {
            let jsonData = JSON.stringify(data);

            let parsedJson = JSON.parse(jsonData);
            if (data.Item == undefined) {

                dynamoDB.putItem(putParams, (err, data) => {
                    if (err) {
                        console.log(err);
                    } else {

                        ses.sendEmail(emailParams).promise()
                            .then(function (data) {
                                console.log(data.MessageId);
                            })
                            .catch(function (err) {
                                console.error(err, err.stack);
                            });
                    }
                });
            } else {
                let curr = new Date().getTime();
                let ttl = Number(parsedJson.Item.ttl.N);
                if (curr > ttl) {

                    dynamoDB.putItem(putParams, (err, data) => {

                        if (err) {
                            console.log(err);
                        } else {
                            ses.sendEmail(emailParams).promise()
                                .then(function (data) {
                                    console.log(data.MessageId);
                                })
                                .catch(function (err) {
                                    console.error(err, err.stack);
                                });
                        }
                    });
                } else {
                    console.log('Email already sent in the last 15 mins for user ::'+email);
                }
            }
        }
    });
}