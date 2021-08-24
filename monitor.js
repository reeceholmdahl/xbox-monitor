const fetch = require('node-fetch'),
    nodemailer = require('nodemailer'),
    fs = require('fs'),
    path = require('path');

/** CONSTANTS DECLARED HERE */

const CANT_BUY = "SOLD_OUT";

const sender = 'xboxmonitorqertygfdn@gmail.com';
const recipient = 'reece@holmdahl.io';

const mailer = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: sender,
        pass: 'eGJveG1vbml0b3JxZXJ0eWdmZG4=',
    }
});

/** LOAD DATA IN FROM monitor.json */

const raw = fs.readFileSync(path.resolve(__dirname, 'monitor.json'), 'utf-8');
const data = JSON.parse(raw);

// Log data
console.log(data);

// Last email time for debug
let lastEmailTime = -1;

/**
 * Function to check best buy stock
 */
async function checkStock() {

    // Build SKU url insert from
    const skuInsert = '%22' + data.skus.join('%22%2C%22') + '%22';

    // Assemble fetch headers
    const headers = new fetch.Headers();
    headers.append('User-Agent', `Monitor/${data.version} API Monitor`);
    headers.append('x-employment', `Hi, I'd like a job in a CS field. My name is Reece, contact me at ZXJycHJAdWJ5enFudXkudmI=`)
    headers.append('Accept', '/*/');
    headers.append('Connection', 'keep-alive');
    headers.append('Host', 'www.bestbuy.com');

    for (const store of data.stores) {

        // Set user agent per call? might assure my calls get thru to other stores indepedently idk
        headers.set('User-Agent', `Monitor/${data.version} API Monitor of ${store.name}/${store.id}`)

        // URL nonsense
        const url = `https://www.bestbuy.com/api/tcfb/model.json?paths=%5B%5B%22shop%22%2C%22buttonstate%22%2C%22v5%22%2C%22item%22%2C%22consolidated%22%2C%22skus%22%2C%5B${skuInsert}%5D%2C%22conditions%22%2C%22NONE%22%2C%22destinationZipCode%22%2C${store.zip}%2C%22storeId%22%2C${store.id}%2C%22context%22%2C%5B%22%2520%22%2C%22package-deals-carousel%22%5D%2C%22addAll%22%2C%22false%22%2C%22consolidated%22%2C%22true%22%2C%22consolidatedButtonState%22%2C%5B%22buttonState%22%2C%22displayText%22%5D%5D%5D&method=get`

        // Make api call
        const response = await fetch(url, {
            headers
        });

        // console.log(response);

        // parse json from call
        const json = await response.json();

        // log store to console
        console.log(`STORE: ${store.name}:`);

        for (const sku of data.skus) {
            
            const buttonValue = json.jsonGraph.shop.buttonstate.v5.item.consolidated.skus[sku].conditions.NONE.destinationZipCode[store.zip].storeId[store.id].context["%20"].addAll.false.consolidated.true.consolidatedButtonState.buttonState.value;
            
            const maybeAbleToBuy = buttonValue !== CANT_BUY;

            console.log(`SKU ${sku}: ${maybeAbleToBuy ? 'may be able to buy!' : 'can\'t buy'} (${buttonValue}) @ https://www.bestbuy.com/site/${sku}.p`);
            
            if (maybeAbleToBuy) {
                console.log(`yoo, ${sku} in stock`);

                const message = {
                    from: sender,
                    to: recipient,
                    subject: `Critical Alert, ${sku} in Stock`,
                    text: 
                    `https://www.bestbuy.com/site/${sku}.p\nat ${store.name} near ${store.zip} @ #${store.id}; TIME: ${Date.now()}`,
                }

                mailer.sendMail(message, (err, info) => {
                    if (err) console.log(err);
                    // else console.log(info);
                });
                lastEmailTime = Date.now();
            }
        }

        console.log();
    }
}

// Test call so I don't have to wait
checkStock();

// Timing logic to make stock check on xx:xx:55 and then xx:(xx+1):05
setTimeout(() => {

    setInterval(() => {
        checkStock();
        
        setTimeout(() => {
            checkStock();
        }, 10 * 1000);

    }, (60 * 1000) );

}, (60000 - Date.now() % 60000 - 5000) );