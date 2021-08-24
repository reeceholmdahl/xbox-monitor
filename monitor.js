const fetch = require('node-fetch'),
    nodemailer = require('nodemailer');

const XBOX_X_SKU = "6428324";
const XBOX_S_SKU = "6430277";

const CANT_BUY = "SOLD_OUT";

const TIME_TO_SEND_ADDITIONAL_EMAIL = 0;

const CHECK_SKUS = [
    XBOX_X_SKU,
    XBOX_S_SKU,
];

const NOTIFY_SKUS = [
    XBOX_X_SKU,
];

class Store {
    constructor(id, zip, name) {
        this.id = id;
        this.zip = zip;
        this.name = name;
    }
}

const APPLE_VALLEY = new Store(245, 55101, "APPLE VALLEY");
const EAGAN = new Store(1055, 55123, "EAGAN");

const stores = [
    APPLE_VALLEY,
    EAGAN,
];

const email = 'xboxmonitorqertygfdn@gmail.com';
const recipient = 'reece@holmdahl.io';

const mailer = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: email,
        pass: 'eGJveG1vbml0b3JxZXJ0eWdmZG4=',
    }
});

const skuInsert = '%22' + CHECK_SKUS.join('%22%2C%22') + '%22';

const headers = new fetch.Headers();
headers.append('User-Agent', 'Monitor/0.1.1 API Monitor');
headers.append('x-employment', `Hi, I'd like a job in a CS field. My name is Reece, contact me at ZXJycHJAdWJ5enFudXkudmI=`)
headers.append('Accept', '/*/');
headers.append('Connection', 'keep-alive');
headers.append('Host', 'www.bestbuy.com');

let lastEmailTime = Date.now() - TIME_TO_SEND_ADDITIONAL_EMAIL;

async function checkStock() {

    const checkTime = Date.now() - lastEmailTime;
    console.log(checkTime)
    if (checkTime > TIME_TO_SEND_ADDITIONAL_EMAIL) {
        for (const store of stores) {

            headers.set('User-Agent', `Monitor/0.1.1 API Monitor of ${stores.name}/${store.id}`)

            const response = await fetch(`https://www.bestbuy.com/api/tcfb/model.json?paths=%5B%5B%22shop%22%2C%22buttonstate%22%2C%22v5%22%2C%22item%22%2C%22consolidated%22%2C%22skus%22%2C%5B${skuInsert}%5D%2C%22conditions%22%2C%22NONE%22%2C%22destinationZipCode%22%2C${store.zip}%2C%22storeId%22%2C${store.id}%2C%22context%22%2C%5B%22%2520%22%2C%22package-deals-carousel%22%5D%2C%22addAll%22%2C%22false%22%2C%22consolidated%22%2C%22true%22%2C%22consolidatedButtonState%22%2C%5B%22buttonState%22%2C%22displayText%22%5D%5D%5D&method=get`, {
                headers
            });

            // console.log(response);

            const json = await response.json();

            console.log(`STORE: ${store.name}:`);

            for (const sku of CHECK_SKUS) {
                
                const buttonValue = json.jsonGraph.shop.buttonstate.v5.item.consolidated.skus[sku].conditions.NONE.destinationZipCode[store.zip].storeId[store.id].context["%20"].addAll.false.consolidated.true.consolidatedButtonState.buttonState.value;
                
                const maybeAbleToBuy = buttonValue !== CANT_BUY;

                console.log(`SKU ${sku}: ${maybeAbleToBuy ? 'may be able to buy!' : 'can\'t buy'} (${buttonValue}) @ https://www.bestbuy.com/site/${sku}.p`);
                
                if (maybeAbleToBuy && NOTIFY_SKUS.includes(sku)) {
                    console.log(`yoo, ${sku} in stock`);

                    const message = {
                        from: email,
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
}

setTimeout(() => {

    setInterval(() => {
        checkStock();
        
        setTimeout(() => {
            checkStock();
        }, 10 * 1000);

    }, (60 * 1000) );

}, (60000 - Date.now() % 60000 - 5000) );