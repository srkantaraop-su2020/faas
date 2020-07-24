const aws = require("aws-sdk");

aws.config.update({region: 'us-east-1'});
var ses = new aws.SES();
console.log(" starting  indexjs")
var ddb = new aws.DynamoDB({ apiVersion: '2012-08-10' });

exports.handler = function (event, context, callback) {
    console.log(event.Records[0].Sns);

    let message = event.Records[0].Sns.Message;
    let messageDataJson = JSON.parse(JSON.parse(message).data);

    let email = messageDataJson.Email;
    let token = messageDataJson.Token;

    let currentTime = new Date().getTime();
    let ttl = 3 * 60 * 1000;
    let expirationTime = (currentTime + ttl).toString();

    var emailParams = {
        Destination: {
            ToAddresses: [
                email
            ]
        },
        Message: {
            Body: {
                Text: {
                    Charset: "UTF-8",
                    Data:  "Dear User, here is the link to reset your password: "+ "http://prod.pavan.website/token="+ token
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

    


    ddb.getItem(queryParams, (err, data) => {


        if (err) {
            console.log(err);
        } else {
            let jsonData = JSON.stringify(data);

            let parsedJson = JSON.parse(jsonData);
            if (data.Item == undefined) {

                ddb.putItem(putParams, (err, data) => {
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

                    ddb.putItem(putParams, (err, data) => {

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
                    console.log('Email already sent in the last 60 mins for user ::'+email);
                }
            }
        }
    });
}