var restify = require('restify');
var builder = require('botbuilder');

// Get secrets from server environment
var botConnectorOptions = { 
    // appId: process.env.BOTFRAMEWORK_APPID, 
    // appPassword: process.env.BOTFRAMEWORK_APPSECRET

    appId: '4c370df0-faeb-408b-b535-52ad282273a0',
    appPassword: 'rsaizSV7828*rxGVZEJ3@%='
};

// Create bot
var connector = new builder.ChatConnector(botConnectorOptions);
var bot = new builder.UniversalBot(connector);

bot.dialog('/', function (session) {
    
    //respond with user's message
    session.send("You said " + session.message.text);
});

// Setup Restify Server
var server = restify.createServer();

// Handle Bot Framework messages
server.post('/api/messages', connector.listen());

// Serve a static web page

//old cold
// server.get(/.*/, restify.serveStatic({
// 	'directory': '.',
// 	'default': 'index.html'
// }));


//new code
server.get('/', restify.plugins.serveStatic({
 directory: __dirname,
 default: '/index.html'
}));

server.listen(process.env.port || 3978, function () {
    console.log('%s listening to %s', server.name, server.url); 
});