
import fs from 'fs';

const API_KEY = "gaston_sec_2026_xK9mPq4wL8nR";
const API_URL = "https://gaston-backendmicroservice.toooti.easypanel.host/api/v1/clients";
const CLIENT_ID = "1d8325c8-829c-410b-b983-9c0cba241e6c";

const log = (msg) => {
    console.log(msg);
    fs.appendFileSync('verify_uppercase_status.txt', msg + '\n');
};

async function run() {
    log(`[${new Date().toISOString()}] Starting Uppercase Status Test...`);

    // VALUES FROM DOCS: CONTACTADO, PROSPECTO, CLIENTE, INACTIVO
    // Let's try "PROSPECTO"
    const targetStatus = "PROSPECTO";

    log(`Sending PATCH with status: "${targetStatus}"`);

    let response = await fetch(`${API_URL}/${CLIENT_ID}`, {
        method: 'PATCH',
        headers: {
            "x-api-key": API_KEY,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: targetStatus })
    });

    let result = await response.json();
    log(`Update Response: ${response.status}`);
    log(`Update Body (status): ${result.data?.status}`);

    // Wait for propagation
    await new Promise(r => setTimeout(r, 1000));

    log("Verifying persistence...");
    response = await fetch(`${API_URL}?_t=${Date.now()}`, { headers: { "x-api-key": API_KEY } });
    let data = await response.json();
    let client = Array.isArray(data) ? data.find(c => c.id === CLIENT_ID) : (data.data || []).find(c => c.id === CLIENT_ID);

    log(`Persisted status: ${client?.status}`);

    if (client?.status === targetStatus) {
        log("SUCCESS: Uppercase status persisted correctly.");
    } else {
        log("FAILURE: Status did not persist.");
    }
}

run();
