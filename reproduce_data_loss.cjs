
const https = require('https');
const fs = require('fs');

const API_KEY = "gaston_sec_2026_xK9mPq4wL8nR";
const HOST = "gaston-backendmicroservice.toooti.easypanel.host";
const PATH = "/api/v1/clients";

const log = (msg) => {
    console.log(msg);
};

function request(method, path, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: HOST,
            path: path,
            method: method,
            headers: {
                "x-api-key": API_KEY,
                "Content-Type": "application/json"
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve(body);
                }
            });
        });

        req.on('error', (e) => reject(e));
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function run() {
    log(`[${new Date().toISOString()}] Starting Data Loss Reproduction...`);

    const clientId = "583abbaa-401a-41e5-8f8e-bec120d5a7d4";
    log(`Using Existing Client ID: ${clientId}`);

    // Wait 1s
    await new Promise(r => setTimeout(r, 1000));

    // 2. Update Address (Step 1)
    const addressValue = "Calle Falsa 123 " + Date.now();
    log(`Updating address to: ${addressValue}`);

    const patch1Res = await request('PATCH', `${PATH}/${clientId}`, {
        address: addressValue,
        localidad: "Springfield"
    });
    log(`PATCH 1 Response: ${JSON.stringify(patch1Res)}`);

    // Verify Address
    let get1Res = await request('GET', `${PATH}?limit=100&_t=${Date.now()}`);
    let list1 = Array.isArray(get1Res) ? get1Res : (get1Res.data || []);
    let client = list1.find(c => String(c.id) === String(clientId));

    if (!client) {
        log("Error: Client not found in list after update.");
        return;
    }

    log(`Address after update: ${client.address}`);
    if (client.address !== addressValue) {
        log("ERROR: Address was not updated correctly in step 1.");
        return;
    }

    // 3. Update Status using FULL PAYLOAD (Simulating FIX)
    const newStatus = "facturado";
    log(`Updating status to: ${newStatus} (PRESERVING DATA)`);

    // We already have 'client' from previous step (line 64+). 
    // It has the correct address.
    // We construct the body reusing existing fields.
    const fullBody = { ...client };
    fullBody.status = newStatus;
    fullBody.categoria = newStatus;
    fullBody.internal_code = newStatus;

    await request('PATCH', `${PATH}/${clientId}`, fullBody);

    // 4. Verify Address Again
    let get2Res = await request('GET', `${PATH}?limit=100&_t=${Date.now()}`);
    let list2 = Array.isArray(get2Res) ? get2Res : (get2Res.data || []);
    client = list2.find(c => String(c.id) === String(clientId));

    if (!client) {
        log("Error: Client not found in list after status change.");
        return;
    }

    log(`Address after status change: ${client.address}`);
    log(`Localidad after status change: ${client.localidad}`);

    if (client.address !== addressValue) {
        log("CRITICAL: Address was LOST after status update!");
        log(`Expected: ${addressValue}`);
        log(`Got: ${client.address}`);
    } else {
        log("Address persisted correctly.");
    }
}

run();
