const aws = require("aws-sdk");

aws.config.update({region: 'us-east-1'});
var ses = new aws.SES();
console.log(" starting  indexjs")

exports.handler = function (event, context, callback) {
console.log("starting handler")

var params = {
    Destination: {
        ToAddresses: [
            'srkantarao.p@northeastern.edu'
        ]
    },
    Message: {
        Body: {
            Text: {
                Charset: "UTF-8",
                Data:  "hi there !! this ie generated email"
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