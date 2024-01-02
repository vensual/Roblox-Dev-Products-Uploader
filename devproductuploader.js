const https = require('https');

const devProducts = [
    { name: "Product1", price: 150, description: "This is your first product add more to the table if you'd like." },
];

function httpRequest(options) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, data: responseData, headers: res.headers });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getXCSRFToken(cookie) {
    const response = await httpRequest({
        hostname: 'auth.roblox.com',
        path: '/v2/logout',
        method: 'POST',
        headers: {
            'Cookie': `.ROBLOSECURITY=${cookie}`
        }
    });
    return response.headers['x-csrf-token'];
}

async function addDeveloperProduct(cookie, universeId, name, priceInRobux, description) {
    const xcsrfToken = await getXCSRFToken(cookie);

    const requestData = {
        name: name,
        description: description,
        priceInRobux: priceInRobux
    };

    console.log("Sending request data:", requestData);

    const response = await httpRequest({
        hostname: 'apis.roblox.com',
        path: `/developer-products/v1/universes/${universeId}/developerproducts?name=${encodeURIComponent(name)}&description=${encodeURIComponent(description)}&priceInRobux=${priceInRobux}`,
        method: 'POST',
        headers: {
            'Cookie': `.ROBLOSECURITY=${cookie}`,
            'X-CSRF-TOKEN': xcsrfToken,
            'Content-Type': 'application/json'
        }
    });

    if (response.statusCode === 200) {
        console.log(`Uploaded ${name} with ID ${JSON.parse(response.data).id}`);
        return JSON.parse(response.data);
    } else {
        console.error(`Failed to upload product ${name}. Status: ${response.statusCode}, Response: ${response.data}`);
        return null;
    }
}

async function getCurrentUser(jar) {
    const options = {
        hostname: 'www.roblox.com',
        path: '/mobileapi/userinfo',
        method: 'GET',
        headers: {
            'Cookie': `.ROBLOSECURITY=${jar}`
        }
    };

    const response = await httpRequest(options);

    if (response.statusCode !== 200) {
        throw new Error('You are not logged in.');
    }

    return JSON.parse(response.data);
}

async function main() {
    const cookie = 'putyourcookiehere';
    const uid = 'putyouruniverseidhere';

    try {
        const currentUser = await getCurrentUser(COOKIE);
        console.log("Logged in as:", currentUser.UserName);

        for (const product of devProducts) {
            await addDeveloperProduct(cookie, uid, product.name, product.price, product.description);
            await delay(1000);
        }
    } catch (error) {
        console.error(error.message);
    }
}

main();
