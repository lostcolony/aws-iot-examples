// Assumptions: 
// You are using a set of AWS credentials with sufficient permissions (these would be iot:Connect, iot:Publish, and iot:Subscribe)
// to the appropriate resources (arn:aws:iot:us-east-1:{accountId}:* is what I used; you can limit it further as appropriate)

// These credentials are specified in the global config directory (~/.aws/credentials for Mac/Linux), and if not default, you have
// specified them by alias by setting the environment variable AWS_PROFILE=(alias)


const AWS = require('aws-sdk');
const AWSDevices = require('aws-iot-device-sdk');


function init(credentials) {
    return new Promise(function (resolve, reject) {
        const device = AWSDevices.device({
            region: "us-east-1",
            clientId: "use something meaningful here, uniquely identifying this connection - ws",
            protocol: 'wss',
            maximumReconnectTimeMs: 8000,
            debug: false,
            baseReconnectTimeMs: 100,
            accessKeyId: credentials.accessKeyId,
            secretKey: credentials.secretAccessKey
        })
        
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
            reject();
        });

        device.on('connect', function () {
            device.on('message', messageHandler);
            device.subscribe("custom_topic", function() {resolve(device)})
        });
    });
};

function messageHandler(topic, message) {
    console.log("message callback - topic: ", topic, "message:", message.toString())
}

init(AWS.config.credentials).then(device => device.publish("custom_topic", "test message"));