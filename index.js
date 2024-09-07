require('dotenv').config();
const restify = require('restify');
const { CloudAdapter, ConfigurationServiceClientCredentialFactory, ConfigurationBotFrameworkAuthentication, CardFactory } = require('botbuilder');
const adaptiveCard = require('./adaptiveCard.json');  // Import the Adaptive Card JSON

// Define the credentials for the bot
const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
    MicrosoftAppId: process.env.MICROSOFT_APP_ID,
    MicrosoftAppPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Set up the authentication for the bot
const botFrameworkAuth = new ConfigurationBotFrameworkAuthentication({}, credentialsFactory);

// Create the CloudAdapter
const adapter = new CloudAdapter(botFrameworkAuth);

// Enhanced error handling with detailed logging
adapter.onTurnError = async (context, error) => {
    console.error(`[onTurnError] Unhandled error: ${error.message}`);
    console.error(`Error stack: ${error.stack}`);  // Log the stack trace for debugging
    try {
        await context.sendActivity(`Oops! Something went wrong: ${error.message}`);
    } catch (sendError) {
        console.error('Error sending activity:', sendError);
    }
};

// Create bot instance (basic logic for Adaptive Cards)
// const bot = {
//     run: async (context) => {
//         try {
//             console.log('Processing activity type:', context.activity.type);

//             if (context.activity.type === 'message' && context.activity.text) {
//                 const userMessage = context.activity.text.trim().toLowerCase();  // Normalize the input
//                 console.log('Received message:', userMessage);

//                 if (userMessage === 'show card') {
//                     // Send the Adaptive Card
//                     const card = CardFactory.adaptiveCard(adaptiveCard);
//                     console.log('Sending Adaptive Card...');
//                     await context.sendActivity({ attachments: [card] });
//                     console.log('Adaptive Card sent.');
//                 } else {
//                     console.log('Sending response:', context.activity.text);
//                     await context.sendActivity(`You said: ${context.activity.text}`);
//                 }
//             } else if (context.activity.type === 'message' && context.activity.value) {
//                 console.log('Handling form submission:', context.activity.value);
//                 const submittedData = context.activity.value;
//                 if (submittedData.userName) {
//                     await context.sendActivity(`Hello, ${submittedData.userName}!`);
//                 } else {
//                     await context.sendActivity('You submitted the form, but no name was entered.');
//                 }
//             } else {
//                 console.log('Non-message activity detected.');
//                 await context.sendActivity('Sorry, I could not process that request.');
//             }
//         } catch (error) {
//             console.error('Error inside bot logic:', error);
//             await context.sendActivity('Something went wrong while processing your request.');
//         }
//     }
// };

const bot = {
    run: async (context) => {
        try {
            console.log('Processing activity type:', context.activity.type);

            if (context.activity.type === 'message' && context.activity.text) {
                const userMessage = context.activity.text.trim().toLowerCase();  // Normalize the input
                console.log('Received message:', userMessage);

                if (userMessage === 'show card') {
                    console.log('Sending Adaptive Card...');
                    const card = CardFactory.adaptiveCard(adaptiveCard);
                    await context.sendActivity({ attachments: [card] });
                    console.log('Adaptive Card sent.');
                } else {
                    console.log('Sending response:', context.activity.text);
                    await context.sendActivity(`You said: ${context.activity.text}`);
                }
            } else if (context.activity.type === 'message' && context.activity.value) {
                console.log('Handling form submission:', context.activity.value);
                const submittedData = context.activity.value;
                if (submittedData.userName) {
                    await context.sendActivity(`Hello, ${submittedData.userName}!`);
                } else {
                    await context.sendActivity('You submitted the form, but no name was entered.');
                }
            } else {
                console.log('Non-message activity detected.');
                await context.sendActivity('Sorry, I could not process that request.');
            }

            // Log the end of request processing
            console.log('Finished processing request.');

        } catch (error) {
            console.error('Error inside bot logic:', error);
            await context.sendActivity('Something went wrong while processing your request.');
        }
    }
};


// Create the Restify server
const server = restify.createServer();
server.use(restify.plugins.bodyParser());

// Start the server and log the port
server.listen(process.env.PORT || 3978, function () {
    console.log(`\nBot is listening on port ${server.url}`);
});

// logging for POST requests
server.post('/api/messages', async (req, res) => {
    console.log('POST /api/messages received');
    try {
        await adapter.process(req, res, async (context) => {
            console.log('Processing request in bot...');
            await bot.run(context);  // Call your bot logic here
            console.log('Request processed successfully.');
        });
    } catch (error) {
        console.error('Error processing /api/messages request:', error);

        // Ensure a response is sent if an error occurs
        res.status(500).json({ code: 'InternalServer', message: 'Failed to process message request' });
    } finally {
        console.log('End of request chain reached.');
    }
});


// Handle GET requests (return 405)
server.get('/api/messages', (req, res, next) => {
    res.send(405, { code: 'MethodNotAllowed', message: 'GET is not allowed on this endpoint. Use POST instead.' });
    return next();  // Properly signal the end of the request chain
});
