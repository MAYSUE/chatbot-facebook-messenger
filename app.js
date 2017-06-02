'use strict';

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const fs = require('fs')

const APP_TOKEN = ''

var app = express()
const folderPath = __dirname + '/app'

app.use(bodyParser.json())

// Declare port 
var PORT = process.env.PORT || 3000;

// Mount your static paths
// Renders your image, title, paragraph and index.html
app.use(express.static(folderPath))

// Start the server.
app.listen(PORT,function(){
	console.log('Listening localhost:3000')
})

// Read file index 
app.get('/',function(req, res){
	res.sendFile(path.join(__dirname + '/index.html'));
})

// Mount your other paths
// In this case render 404.
app.get("*",function (req, res) {
  res.status(404).send('<h1>File not found</h1>');
});

// Request with method get webhook 
app.get('/webhook',function(req, res){
	console.log(req);
	console.log(res);
	if(req.query['hub.verify_token'] === 'hello_token'){
		res.send(req.query['hub.challenge'])
	}else{
		res.send('')
	}
})

// Request with method post webhook
app.post('/webhook',function(req, res){
	var data = req.body
	console.log(data);
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
function getMessage(event){
	var senderID = event.sender.id
	var messageText = event.message.text

	evaluateTextMessage(senderID, messageText)
}

// Evaluate text message
function evaluateTextMessage(senderID, messageText){
	var message = '';

	if(isContain(messageText,'ayuda')){
		message = 'Por el momento no te puedo ayudar :('
	}else if(isContain(messageText,'info')){
		message = 'Hola que tal'
	}else{
		message = 'Solo se repetir las cosas T_T '+ messageText
	}

	SendTextMessage(senderID, message)
}


// Send text message
function SendTextMessage(senderID, message){
	var messageData = {
		recipient : {
			id: senderID
		},
		message: {
			text: message
		}
	}

	callSendApi(messageData)
}

// Calling API to send message
function callSendApi(messageData){
	request({
		uri: 'https://graph.facebook.com/v2.9/me/messages',
		qs: {access_token: APP_TOKEN},
		method: 'POST',
		json: messageData
	},function(error, response, data){
		console.log(response);
		console.log(data);
		if(error)
			console.log('Can not send message');
		else
			console.log('Successful message');
	})
}

//
function isContain(texto, word){
	if(typeof texto=='undefined' || texto.lenght<=0) return false
	return texto.indexOf(word) > -1
}