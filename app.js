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
	if(req.query['hub.verify_token'] === 'hello_token'){
		res.send(req.query['hub.challenge'])
	}else{
		res.send('Invalid token');
	}
})

// Request with method post to webhook
app.post('/webhook',function(req, res){
	var data = req.body
	if(data.object == 'page'){
		data.entry.forEach(function(pageEntry){
			pageEntry.messaging.forEach(function(messagingEvent){
				if(messagingEvent.message){
					getMessage(messagingEvent)
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
		uri: 'https://graph.facebook.com/v2.9/me/messages',
		qs: {access_token: process.env.APP_TOKEN},
		method: 'POST',
		json: messageData
	},function(error, response, data){
		if(error)
			console.log('Cannot send message');
		else
			console.log('Successful message');
	})
}
