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

    var params = {
        Destination: {
            ToAddresses: [
                email
            ]
        },
        Message: {
            Body: {
                Text: {
                    Charset: "UTF-8",
                    Data:  "Hi there, your link to reset password is"+link
                }
            },
            Subject: {
                Charset: "UTF-8",
                Data: " Password Reset Link"
            }
        },
        Source: "passwordreset@prod.pavan.website"
    };

    ses.sendEmail(params).promise().then((data) => {
        console.log("email successfully sent");
    })
    .catch((err)=>{
        console.log("error occured"+ err)
    })

}
console.log(" lamba complete 1")