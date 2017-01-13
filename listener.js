// Assumptions: 
// For MQTT
// You have created a certificate in the AWS IoT console (or uploaded your own), and attached a policy with the necessary permissions
// (these would be iot:Connect, iot:Publish, and iot:Subscribe) on the appropriate resource(s) (arn:aws:iot:us-east-1:{accountId}:* is what I used; you can limit it further as appropriate)
// 
// The certificate, private key, and CA for AWS IoT that you were told to download exist in ./certs/, with the names as specified in the keyPath, certPath, and caPath options below.


// For WSS
// You are using a set of AWS credentials with sufficient permissions (these would be, for thing creation, iot:CreateThing, and for sending/receiving
// data, iot:Connect, iot:Publish, iot:UpdateThingShadow, iot:GetThingShadow, and iot:Subscribe)
// to the appropriate resources (arn:aws:iot:us-east-1:{accountId}:* is what I used; you can limit it further as appropriate)

// These credentials are specified in the global config directory (~/.aws/credentials for Mac/Linux), and if not default, you have
// specified them by alias by setting the environment variable AWS_PROFILE=(alias)


//Change this to change out connection type; false = websockets.
const USE_MQTT = false;

const AWS = require('aws-sdk');
const AWSDevices = require('aws-iot-device-sdk');

const iot = new AWS.Iot({region: 'us-east-1'});


function getConfigOpts(credentials) {
	if(USE_MQTT) {
		return {
			region: "us-east-1",
      clientId: "use something meaningful here, uniquely identifying this connection - listener",
      maximumReconnectTimeMs: 8000,
      debug: false,
      baseReconnectTimeMs: 100,
      keyPath: __dirname + "/certs/private.key",
      certPath: __dirname + "/certs/device.crt",
      caPath: __dirname + "/certs/ca.pem",
  	  host: config.get("iot_host")
		}
	} else {
		return {
			region: "us-east-1",
      clientId: "use something meaningful here, uniquely identifying this connection - listener",
      protocol: 'wss',
      maximumReconnectTimeMs: 8000,
      debug: false,
      baseReconnectTimeMs: 100,
      accessKeyId: credentials.accessKeyId,
      secretKey: credentials.secretAccessKey
		}
	}
}


function init(credentials) {
    return new Promise(function (resolve, reject) {
    	try {
	        const thingShadows = AWSDevices.thingShadow(getConfigOpts(credentials))
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
			resolve(thingShadows);
		})
	});
}

	

function subscribe(thingShadows) {
	return new Promise(function(resolve, reject) {
		console.log("Setting up handler and subscribing");

    thingShadows.on('delta', function(thingName, stateObject) {
      console.log('received delta on', thingName, 'with values:', JSON.stringify(stateObject));
    });

    thingShadows.on('message', function(topic, message) {
		  console.log("message callback - topic: ", topic, "message:", message.toString())    	
    });

    thingShadows.subscribe("custom_topic", function() {resolve(thingShadows)})
	})
}





const thingId = require('os').networkInterfaces().en0[0].mac;

iot.createThing({thingName: thingId}, function(err, data) {
  if(!err) {
  	init(AWS.config.credentials)
  		.then(thingShadows => register(thingShadows, thingId))
  		.then(thingShadows => subscribe(thingShadows))
  } else {
  	console.error(err);
  }
})
