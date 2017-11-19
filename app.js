var restify = require('restify');
var builder = require('botbuilder');
var azure = require('botbuilder-azure');
var moment = require('moment');

// Setup DB

var documentDbOptions = {
    host: 'https://appetitdb.documents.azure.com:443/',
    masterKey: '9ToGZogeCBixsK5LP4HZw1Bj5bugeBKDYmypBBw4NTpcrYvOxnulIxxBcG0RG4BEBqWrCJBX4h07pDUScYaFyg==',
    database: 'botdocs',
    collection: 'botdata'
};

var docDbClient = new azure.DocumentDbClient(documentDbOptions);

var cosmosStorage = new azure.AzureBotStorage({ gzipData: false }, docDbClient);

// Setup Restify Server
var server = restify.createServer();

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

server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());


server.put('/belt', (req, res, next) => {

        // extract data from body and add timestamps
        const data = Object.assign({}, req.body, {
            updated: new Date()
        })

        // build out findOneAndUpdate variables to keep things organized
        let body  = { $set: data },
            opts  = {
                returnOriginal: false,
                upsert: true
            }

        // let query = { _id: req.params.id },
        //     body  = { $set: data },
        //     opts  = {
        //         returnOriginal: false,
        //         upsert: true
        //     }
        startProactiveDialog1(badsave);

        sendProactiveMessage(req.body);
		//console.log(req.params);
		//console.log(req.body.name);
		//console.log(body);
        // find and update document based on passed in id (via route)
        // collection.findOneAndUpdate(query, body, opts)
        //     .then(doc => res.send(204))
        //     .catch(err => res.send(500, err))
        res.json(req.body);
        next()


    })

// Do GET this endpoint to delivey a notification
// server.get('/trigger', (req, res, next) => {
//     sendProactiveMessage(badsave);
//     res.send('triggered');
//     next();
//   }
// );

server.listen(process.env.port || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});


// Get secrets from server environment
var botConnectorOptions = {
    // appId: process.env.BOTFRAMEWORK_APPID,
    // appPassword: process.env.BOTFRAMEWORK_APPSECRET

    appId: '4c370df0-faeb-408b-b535-52ad282273a0',
    appPassword: 'rsaizSV7828*rxGVZEJ3@%='
};

// Create bot
var connector = new builder.ChatConnector(botConnectorOptions);
var bot = new builder.UniversalBot(connector).set('storage', cosmosStorage);;

const LuisModelUrl = '	https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/9646960e-306f-4203-865f-5cb70c538658?subscription-key=3f76e6d2a6b54d3aa8957b995143bad7&timezoneOffset=0';
var recogniser = new builder.LuisRecognizer(LuisModelUrl);

// Handle Bot Framework messages
server.post('/api/messages', connector.listen());

var intents = new builder.IntentDialog({recognizers:[recogniser]});
intents.matches(/\b(hi|hello|hey|sup)\b/i,'/sayHi');
intents.matches(/\b(rememberme)\b/i,'/rm');
//intents.matches(/\b(yes|yup|okay)\b/i,'/sayYes');
//intents.matches(/\b(no)\b/i,'/sayNo');
intents.matches('viewMenu', '/viewMenu');
intents.matches('orderFood', '/orderFood');
intents.matches('Cancel.Order', 'cancelOrder');
intents.matches('feedback', '/feedback');
//bot.beginDialogAction('sendOrder', '/sendOrder');
//bot.beginDialogAction('confirmOrder', '/confirmOrder');
//bot.beginDialogAction('confirmNo', '/confirmNo');

//intents.matches('analyseImage', '/giveImageAnalysis');
//intents.matches('getFunFact','/funFact');
//intents.matches('getloc','/getLoc');
intents.onDefault(builder.DialogAction.send("Sorry, I didn't understand what you said."))





//=========================================================
// Bots Dialogs
//=========================================================

// This is called the root dialog. It is the first point of entry for any message the bot receives


// bot.dialog('/', function (session) {

//     //respond with user's message
//     session.send("You said " + session.message.text);
// });

bot.dialog('/', intents);

bot.dialog('/sayHi', [
    function (session){
        session.sendTyping();
        session.send("Hey there! I'm Appetit, your canteen butler.");
        session.sendTyping();
        session.endDialog("I can show you the menu, order you food and have it prepared when you plan to eat, but most importantly, I help you portion your food so you won't ever feel starved or bloated!");

    }
]);

bot.dialog('/orderFood', [
    function (session, args, next) {
    	session.sendTyping();
        orderItem = builder.EntityRecognizer.findEntity(args.entities, 'food')
        if (!orderItem) {
        	sendMenu(session);
        	builder.Prompts.text(session, 'What would you like?');
        } else {
           session.dialogData.orderItem = orderItem.entity;
           next();
       }
    },
    function (session, results) {
    	session.sendTyping();
    	//string.indexOf(substring)
    	if (session.dialogData.orderItem){
    		res = session.dialogData.orderItem;
    	} else res = results.response;
    	res = res.toLowerCase();
    	res = res.replace(/\s/g, '');
    	res = res.replace(/[^a-zA-Z ]/g, "")
    	//session.send(`${res}`);


    	f1 = [["spaghetti"],["turkey"],["lambshank"],["fishchip","fishandchip"],["salad"]]
    	f2 = ["Spaghetti Bolognese","Roast Turkey","Braised Lamb Shank","Traditional Fish & Chips","Caesar Salad"]

    	if (res.indexOf(f1[0][0])>=0){
    		res = f2[0]
    	}
    	else if (res.indexOf(f1[1][0])>=0){
    		res = f2[1]
    	}
    	else if (res.indexOf(f1[2][0])>=0){
    		res = f2[2]
    	}
    	else if (res.indexOf(f1[3][0])>=0||res.indexOf(f1[3][1])>=0){
    		res = f2[3]
    	}
    	else if (res.indexOf(f1[4][0])>=0){
    		res = f2[4]
    	}
    	else {
    		session.send('Sorry, we do not have that on the menu today');
    		session.send('Hold on, I will send you the menu.');
    		session.sendTyping();
    		session.dialogData.skip = 1;
    		//add button for menu
    		//session.endDialog();
    		//session.cancelDialog(0, '/viewMenu'); 
    		
    	}
    	if(session.dialogData.skip != 1){
    		session.dialogData.orderItem = res;
    		session.beginDialog('askForDateTime');
    	} else {
    		session.cancelDialog(0, '/viewMenu'); 
    	}
    	//session.send(`${res}`);
        
    },
    function (session, results) {
    	session.sendTyping();
        session.dialogData.mealTime = builder.EntityRecognizer.resolveTime([results.response]);
        mealTime = moment(session.dialogData.mealTime);
        //consider adding card
        session.send("You currently ordering the " + session.dialogData.orderItem + " to be served at " + mealTime.format('LT') + ".");
        //session.userData.orderItem = session.dialogData.orderItem;
        //session.userData.mealTime = mealTime;
	    // var msg = new builder.Message(session)
	    // 	.text("Confirm your order for " + session.dialogData.orderItem + " to be served at " + mealTime.format('LT') + ".")
	    // 	.suggestedActions(
	    // 		builder.SuggestedActions.create(
	    // 				session, [
	    // 					builder.CardAction.imBack(session, "1", "Place Order"),
	    // 					builder.CardAction.imBack(session, "2", "Cancel")
	    // 				]
	    // 			));
	    // session.send(msg);
        builder.Prompts.choice(session, "Do you want to place the order?", ["Yes", "No"]);
    },
    function (session, results) {
    	session.sendTyping();
        session.dialogData.confirmation = results.response.entity;
        if (session.dialogData.confirmation == "Yes") {
        	session.userData.orderItem = session.dialogData.orderItem;
        	session.userData.mealTime = session.dialogData.mealTime;
        	session.send("Alright, your order for " + session.dialogData.orderItem + " has been sent to the kitchen! I'll see you at at " + mealTime.format('LT') + ". :)");
        } else {
        	session.send("Ok! Your order is cancelled.")
        }
        session.endDialog();
        //mealTime = moment(session.dialogData.mealTime);
        //session.send("Alright, your order for " + session.dialogData.orderItem + " has been sent to the kitchen! I'll see you at at " + mealTime.format('LT') + ". :)");
        //session.userData.orderItem = session.dialogData.orderItem;
        //session.userData.mealTime = mealTime;
        
    }
]).cancelAction('cancelAction', 'Ok! Feel free to ask me any other questions.', {
    matches: /^(cancel|nevermind)/i
}).reloadAction('startOver', 'Ok, starting over.', {
    matches: /^start over$/i,
    dialogArgs: {
        isReloaded: true
    }
});

bot.dialog('cancelOrder', [
    function (session) {
        session.send("Ok! Your order is cancelled.")
        session.endDialog;
    }
]).triggerAction({ 
    matches: 'Order.Cancel',
    confirmPrompt: "This will cancel the creation of the order you started. Are you sure?" 
});

bot.dialog('askForDateTime', [
    function (session) {
        builder.Prompts.time(session, "Great! What time will you be having lunch? (e.g.: 2pm)");
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
]);

bot.dialog('/viewMenu', [
    function (session){
        sendMenu(session);
  		session.endDialog();
    }
]);

function sendMenu(session) {
    session.sendTyping();
    var cards = [];
    var list = 5;
    var menu = [];
    menu.push({"name" : "Spaghetti Bolognese", "subtitle" : "Spaghetti in tomoto sauce with minced meat", "image" : "http://img.taste.com.au/5qlr1PkR/taste/2016/11/spaghetti-bolognese-106560-1.jpeg"});
    menu.push({"name" : "Roast Turkey", "subtitle" : "With Cumberland chipolatas, sage stuffing and cranberry sauce.", "image" : "http://3.bp.blogspot.com/_UIXOn06Pz70/TLZBvT5l2RI/AAAAAAAAKzM/rKQrdi2tfEU/s800/Herb+Roasted+Turkey+Breast+Dinner+500.jpg"})
    menu.push({"name" : "Braised Lamb Shank", "subtitle" : "With mashed potato and Rosemarry Jus", "image" : "http://www.recipetineats.com/wp-content/uploads/2016/09/Lamb-Shanks-Port-Braised_3-680x486.jpg"});
    menu.push({"name" : "Traditional Fish & Chips", "subtitle" : "Battered Fish and golden chips", "image" : "http://www.delonghi.com/Global/recipes/multifry/173.jpg"});
    menu.push({"name" : "Caesar Salad", "subtitle" : "Iceberg lettuce, grilled chicken, hard boiled egg and parmesan cheese ", "image" : "http://www.inspiredtaste.net/wp-content/uploads/2012/12/Caesar-Salad-Recipe-1200.jpg"});
    session.send("Here is today's Lunch Menu:");
    for (i = 0; i < menu.length; i++) {

        var curr = menu[i];

        cards.push(new builder.HeroCard(session)
            .title(curr.name)
            .subtitle(curr.subtitle)
            .images([
                    //handle if thumbnail is empty
                    builder.CardImage.create(session, curr.image)
                ])
            .buttons([
                    //Pressing button orders this item
                    builder.CardAction.imBack(session, "I would like to order "+curr.name, "Order item")//,
                    //builder.CardAction.dialogAction(session, 'confirmOrder', curr.name, "Order item")
            ]));

    }
    var msg = new builder.Message(session)
        .textFormat(builder.TextFormat.xml)
        .attachmentLayout(builder.AttachmentLayout.carousel)
        .attachments(cards);
    session.send(msg);

};


//deprecated
// bot.dialog('/confirmOrder', [
//   function(session, result){
//     //console.log(result.data);
//     var item = result.data;
//     var msg = new builder.Message(session)
//     	.text("Confirm your order for " + item + "?")
//     	.suggestedActions(
//     		builder.SuggestedActions.create(
//     				session, [
//     					builder.CardAction.dialogAction(session, "sendOrder", item, "Yes"),
//     					builder.CardAction.dialogAction(session, "confirmNo", "no" , "No")
//     				]
//     			));
//     session.send(msg);
//     return null;
//   }
// ]);

// bot.dialog('/confirmNo', [
//   function(session, result){
//   	console.log(result.data);
//     if (result.data == "no") session.send("Ok! Feel free to ask me any other questions. :)")
//     session.endDialog();
//   }
// ]);

// bot.dialog('/sendOrder', [
//     function (session, result){
//         session.sendTyping();
//         session.dialogData.orderItem = result.data;
//         builder.Prompts.time(session, "Great! What time will you be having lunch?");
//       },
//     function (session, result){
//       mealTime = builder.EntityRecognizer.resolveTime([result.response]);
//       session.userData.mealTime = mealTime;

//       mealTime = moment(mealTime);
//       session.send("Alright, your order for " + session.dialogData.orderItem + " has been sent to the kitchen! I'll see you at at " + mealTime.format('LT') + ". :)");
//       session.userData.orderItem = session.dialogData.orderItem;
//       session.endDialogWithResult(mealTime);
//     }
// ]);

// function sendProactiveMessage(address, response) {
//     var msg = new builder.Message().address(response.address);
//     if (response.mealStatus == "Collected"){
//     	msg.text('Bon Appetit!');
//     	msg.textLocale('en-US');
//     	bot.send(msg);
//     }
//     else if (response.scenario == 1){
//     	//do 1
//     } else if (response.scenario == 2){
//     	//do 2
//     } else if (response.scenario == 3){
//     	//do 3
//     }

//     msg.text('Hello, you have ' + response.mass + 'g of wasted food. Bad!');
//     msg.textLocale('en-US');
//     bot.send(msg);
// }

function sendProactiveMessage(response) {
    var msg = new builder.Message().address(response.address);
    if (response.mealStatus == "Ready"){
    	//session.send("You currently ordering the " + session.dialogData.orderItem + " to be served at " + mealTime.format('LT') + ".");
    	msg.text("Your meal is now ready for collection at tray #21.");
    	msg.textLocale('en-US');
    	bot.send(msg);
    }
    if (response.mealStatus == "Collected"){
    	msg.text('Bon Appetit!');
    	msg.textLocale('en-US');
    	bot.send(msg);
    }
    else if (response.scenario == 1 && response.mealStatus == "Returned"){
    	//do 1
    	startProactiveDialog1(response.address);
    	

    } else if (response.scenario == 2 && response.mealStatus == "Returned"){
    	startProactiveDialog2(response.address);
    	//do 2
    } else if (response.scenario == 3 && response.mealStatus == "Returned"){
    	startProactiveDialog3(response.address);
    	//do 3
    }

    // msg.text('Hello, you have ' + response.mass + 'g of wasted food. Bad!');
    // msg.textLocale('en-US');
    // bot.send(msg);
}



//bad code
var badsave;

bot.dialog('/rm', function(session, args) {
    var savedAddress = session.message.address;
    badsave = savedAddress;
    // (Save this information somewhere that it can be accessed later, such as in a database, or session.userData)
    session.userData.savedAddress = savedAddress;

    var message = 'Hello user, good to meet you! I now know your address and can send you notifications in the future.';
    session.send(message);
    session.endDialog();
})

function startProactiveDialog1(address) {
    bot.beginDialog(address, "*:scen1");
}

bot.dialog('scen1', [
	function (session, args, next) {
   	builder.Prompts.choice(session, "How was your meal?", ["Great!", "It can be improved."]);
   }, function (session, results) {
    	session.sendTyping();
        session.dialogData.confirmation = results.response.entity;
        if (session.dialogData.confirmation == "Great!") {
        	session.send("It's our pleasure!");
        } else {
        	session.send("Sorry. We will do our best to improve.")
        }
        session.endDialog();
        //mealTime = moment(session.dialogData.mealTime);
        //session.send("Alright, your order for " + session.dialogData.orderItem + " has been sent to the kitchen! I'll see you at at " + mealTime.format('LT') + ". :)");
        //session.userData.orderItem = session.dialogData.orderItem;
        //session.userData.mealTime = mealTime;
        
    }]);

function startProactiveDialog2(address) {
    bot.beginDialog(address, "*:scen2");
}

bot.dialog('scen2', function (session, args, next) {
  //session.endDialog('hello user2')
  var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel)
    msg.attachments([
        new builder.HeroCard(session)
            .title("Weekly review: You are now an Foot Soldier (Bottom 15%)!")
            .subtitle("Leftovers: 253g. You were one of the top 50 food wasters!")
            .text("")
            .buttons([
                builder.CardAction.imBack(session, "I want to reduce my portions", "Reduce Portions"),
                builder.CardAction.imBack(session, "I want to reduce my portions", "Maintain Portions"),
            ])
    ]);
    session.send(msg).endDialog();

});

function startProactiveDialog3(address) {
    bot.beginDialog(address, "*:scen3");
}

bot.dialog('scen3', function (session, args, next) {
  //session.endDialog('hello user3')
  var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel)
    msg.attachments([
        new builder.HeroCard(session)
            .title("Weekly review: You are now an Amazonian (Top 5%)!")
            .subtitle("Leftovers: 50g. You've saved 20% of food waste this week!")
            .text("")
            .buttons([
                builder.CardAction.imBack(session, "I want to reduce my portions", "Reduce Portions"),
                builder.CardAction.imBack(session, "I want to reduce my portions", "Maintain Portions"),
                builder.CardAction.imBack(session, "I want to increase my portions", "Increase Portions"),
            ])
    ]);
    session.send(msg).endDialog();

});

bot.dialog('/feedback', [
  function(session){
    session.sendTyping();
    session.send("Your preferences have been saved! Thank you.");
    session.endDialog();
  }
]);


//