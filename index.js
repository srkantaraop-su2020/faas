const aws = require("aws-sdk");

aws.config.update({region: 'us-east-1'});
var ses = new aws.SES();
console.log(" starting  indexjs")

exports.handler = function (event, context, callback) {
    console.log(event.Records[0].Sns);

    let message = event.Records[0].Sns.Message;
    let messageDataJson = JSON.parse(JSON.parse(message).data);

    let email = messageDataJson.Email;
    let link = messageDataJson.Link;

    console.log("Email for :: " + email);
    console.log("Link to send :: " + link);

    let currentTime = new Date().getTime();
    let ttl = 60 * 60 * 1000;
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
                    Data:  "Dear User, here is the link to reset your password: "+link
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
            ttl: { N: expirationTime }
        }
    };
    let queryParams = {
        TableName: 'csye6225',
        Key: {
            'id': { S: email }
        },
    };

    ddb.putItem(putParams, (err, data) => {

        console.log("Data putitem::" + data);

        if (err) {
            console.log(err);
        } else {

            console.log(data);
            console.log('Updating last sent timestamp');

            ses.sendEmail(emailParams).promise()
                .then(function (data) {
                    console.log("email successfully sent");
                })
                .catch(function (err) {
                    console.error(err, err.stack);
                });
        }
    });

}
console.log(" lamba complete 1")