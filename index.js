require('dotenv').config();
const SDK = require('sfmc-sdk');
const fs = require('fs');
const {
    Parser, transforms: {
        flatten, unwind
    }
} = require('json2csv');

/**
 * Configure parser to handle flattening and unwinding data
 */
const json2csvParser = new Parser({
    transforms: [flatten({
        objects: true,
        arrays: false
    }), unwind({
        paths: ['Roles.Role'],
        blankOut: true
    })]
});

/**
 * Connect to sfmc SDK
 */
const sfmc = new SDK({
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    auth_url: process.env.AUTH_URL,
    account_id: process.env.ACCOUNT_ID,
}, {
    eventHandlers: {
        onLoop: (type, accumulator) => console.log('Looping', type, accumlator.length),
        onRefresh: (options) => console.log('RefreshingToken.', options),
        logRequest: (req) => console.log(req),
        logResponse: (res) => console.log(res),
        onConnectionError: (ex, remainingAttempts) => console.log(ex.code, remainingAttempts)

    },
    requestAttempts: 1,
    retryOnConnectionError: true
});

/**
 * Soap Retrieve MC AccountUser data 
 */
async function run() {
    const soapRetrieve = await sfmc.soap
        .retrieve('AccountUser', [
            'ID',
            'AccountUserID',
            'Name',
            'Email',
            'Roles',
            'ActiveFlag',
            'CreatedDate',
            'CustomerKey',
            'DefaultBusinessUnit',
            'IsAPIUser',
            'IsLocked',
            'LastSuccessfulLogin',
            'MustChangePassword',
            'Name',
            'NotificationEmailAddress',
            'UserID'
        ], {});

    // Write
    writeData(soapRetrieve.Results);
}

/**
 * Create csv and json data
 * @param {*} data 
 */
function writeData(data) {

    // Create CSV
    const csv = json2csvParser.parse(data)
    fs.writeFile('users.csv', csv, function(err) {
        if (err) throw err;
        console.log('csv complete');
    });

    // Create raw JSON
    fs.writeFile("raw.json", JSON.stringify(data), function(err) {
        if (err) throw err;
        console.log('JSON complete');
    });
}

// Run
run();