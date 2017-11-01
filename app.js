'use strict';

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const fs = require('fs')
const Promise = require("bluebird");
require('dotenv').config()

// Declare connection database
var getSqlConnection = require('./app/database/config.js');

var app = express()

// Declare folder path
const folderPath = __dirname + '/src'

// Parse incoming requests
app.use(bodyParser.json())

// Mount your static paths
// Renders your image, title, paragraph and index.html
app.use(express.static(folderPath))

// Start the server.
app.listen(process.env.PORT,function(){
	console.log('Listening localhost in port: ' + process.env.PORT);
})

// Read file index and send
app.get('/',function(req, res){
	res.sendFile(path.join(__dirname + '/index.html'));
})

// Request with method get to webhook
app.get('/webhook',function(req, res){
	if (req.query['hub.mode'] === 'subscribe' &&
		req.query['hub.verify_token'] === 'hello_token') {
		console.log("Validating webhook");
	res.status(200).send(req.query['hub.challenge']);
	} else {
		console.error("Failed validation. Make sure the validation tokens match.");
	res.sendStatus(403);          
	}  
})

// Request with method post to webhook
app.post('/webhook',function(req, res){
	var data = req.body
	if(data.object == 'page'){
		data.entry.forEach(function(pageEntry){
			pageEntry.messaging.forEach(function(event){
				if(event.message){
					console.log("Webhook received unknown event: ", event);					
					getMessage(event)
				}
			})
		})
	}
	res.sendStatus(200)
})

// Get text messages
function getMessage(messagingEvent){
	var senderID = messagingEvent.sender.id
	var messageText = messagingEvent.message.text
	evaluateTextMessage(senderID, messageText)
}

// Evaluate text message
function evaluateTextMessage(senderID, messageText){
	Promise.using(getSqlConnection(), function(connection) {
	    return connection.query('select response from lexico where word = ? and deleted = 0', [messageText]).then(function(rows) {
			console.log(rows[0].response);
			SendTextMessage(senderID, rows[0].response);
	    }).catch(function(error) {
	      	SendTextMessage(senderID, 'I cannot help you');
	    });
	});
}

// Send text message
function SendTextMessage(senderID, messageText){
	var messageData = {
		recipient : {
			id: senderID
		},
		message: {
			text: messageText
		}
	}
	callSendApi(messageData)
}

// Calling API to send message
function callSendApi(messageData){
	request({
		uri: 'https://graph.facebook.com/v2.6/me/messages',
		qs: { access_token: ''},
		method: 'POST',
		json: messageData
	},function(error, response, body){
		if (!error && response.statusCode == 200) {
			var recipientId = body.recipient_id;
			var messageId = body.message_id;
			console.log("Successfully sent generic message with id %s to recipient %s", messageId, recipientId);
		} else {
			console.error("Unable to send message.");
			console.error(response);
			console.error(error);
		}
	})
}
