// Assumptions: 
// You have created a certificate in the AWS IoT console (or uploaded your own), and attached a policy with the necessary permissions
// (these would be iot:Connect, iot:Publish, and iot:Subscribe) on the appropriate resource(s) (arn:aws:iot:us-east-1:{accountId}:* is what I used; you can limit it further as appropriate)
// 
// The certificate, private key, and CA for AWS IoT that you were told to download exist in ./certs/, with the names as specified in the keyPath, certPath, and caPath options below.




const AWS = require('aws-sdk');
const AWSDevices = require('aws-iot-device-sdk');


function init() {
    return new Promise(function (resolve, reject) {
        try {
        const device = AWSDevices.device({
            region: "us-east-1",
            clientId: "use something meaningful here, uniquely identifying this connection",
            maximumReconnectTimeMs: 8000,
            debug: false,
            baseReconnectTimeMs: 500,
            keyPath: __dirname + "/certs/private.key",
            certPath: __dirname + "/certs/device.crt",
            caPath: __dirname + "/certs/ca.pem"
        })
    }catch(ex) {
        console.log(ex);
    }

        device.on('close', function() {
            console.log('disconnected', arguments);
        });

        device.on('error', function() {
            console.log('error', arguments);
        });

        device.on('reconnect', function() {
            console.log('reconnecting', arguments);
        });

        device.on('timeout', function() {
            console.log("Failed");
            reject();
        });

        device.on('connect', function () {
            console.log("Connected");
            device.on('message', messageHandler);
            device.subscribe("custom_topic", function() {resolve(device)})
        });
    });
};

function messageHandler(topic, message) {
    console.log("message callback - topic: ", topic, "message:", message.toString())
}

init().then(device => device.publish("custom_topic", "test message"));