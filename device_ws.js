// Assumptions: 
// You are using a set of AWS credentials with sufficient permissions (these would be, for thing creation, iot:CreateThing, and for sending/receiving
// data, iot:Connect, iot:Publish, iot:UpdateThingShadow, iot:GetThingShadow, and iot:Subscribe)
// to the appropriate resources (arn:aws:iot:us-east-1:{accountId}:* is what I used; you can limit it further as appropriate)

// These credentials are specified in the global config directory (~/.aws/credentials for Mac/Linux), and if not default, you have
// specified them by alias by setting the environment variable AWS_PROFILE=(alias)

const AWS = require('aws-sdk');
const AWSDevices = require('aws-iot-device-sdk');

const iot = new AWS.Iot({region: 'us-east-1'});

function init(credentials) {
    return new Promise(function (resolve, reject) {
    	try {
	        const thingShadows = AWSDevices.thingShadow({
	            region: "us-east-1",
	            clientId: "use something meaningful here, uniquely identifying this connection",
	            protocol: 'wss',
	            maximumReconnectTimeMs: 8000,
	            debug: false,
	            baseReconnectTimeMs: 100,
	            accessKeyId: credentials.accessKeyId,
	            secretKey: credentials.secretAccessKey
	        })
    	}catch (ex) {console.log(ex)}

        thingShadows.on('connect', function () {
        	console.log("Connected");
        	resolve(thingShadows)
        });
    });
};

function register(thingShadows, thingId) {
	return new Promise(function(resolve, reject) {
		//Register interest in the thing with thingId
		thingShadows.register(thingId, {}, function() {
			thingShadows.on('delta', function(thingName, stateObject) {
			    console.log('received delta on', thingName, 'with values:', JSON.stringify(stateObject));
			});

			resolve(thingShadows);
		})
	});
}

function publish(thingShadows, thingId, json) {
	console.log("Publishing: ", JSON.stringify(json));
	const val = thingShadows.update(thingId, json);
	if(!val) {
		console.log("Failed to update");
	}
}


const thingId = require('os').networkInterfaces().en0[0].mac;

iot.createThing({thingName: thingId}, function(err, data) {
  if(!err) {
  	init(AWS.config.credentials)
  		.then(thingShadows => register(thingShadows, thingId))
  		.then(thingShadows => publish(thingShadows, thingId, {"state" : {"desired" : {"b" : 1}}}))
  } else {
  	console.error(err);
  }
})
