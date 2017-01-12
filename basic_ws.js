const AWS = require('aws-sdk');
const AWSDevices = require('aws-iot-device-sdk');


function init(credentials) {
    return new Promise(function (resolve, reject) {
        const device = AWSDevices.device({
            region: "us-east-1",
            clientId: "use something meaningful here, uniquely identifying this connection",
            protocol: 'wss',
            maximumReconnectTimeMs: 8000,
            debug: false,
            baseReconnectTimeMs: 100,
            accessKeyId: credentials.accessKeyId,
            secretKey: credentials.secretAccessKey
        })

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