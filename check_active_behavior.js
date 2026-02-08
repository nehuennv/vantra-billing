
import fs from 'fs';

const API_KEY = "gaston_sec_2026_xK9mPq4wL8nR";
const API_URL = "https://gaston-backendmicroservice.toooti.easypanel.host/api/v1/clients";

const log = (msg) => {
    console.log(msg);
    fs.appendFileSync('check_active_behavior.txt', msg + '\n');
};

async function check(params, label) {
    const query = new URLSearchParams(params).toString();
    const url = `${API_URL}?limit=5&${query}`;
    log(`\nTesting ${label} (${url})...`);

    try {
        const response = await fetch(url, { headers: { "x-api-key": API_KEY } });
        const data = await response.json();
        const clients = Array.isArray(data) ? data : (data.data || []);

        log(`Count: ${clients.length}`);
        clients.forEach(c => {
            // Check raw is_active, could be boolean or 0/1 or string "true"/"false"
            log(`- ID: ${c.id}, is_active: ${c.is_active}, status: ${c.status}`);
        });
    } catch (e) {
        log(`Error: ${e.message}`);
    }
}

async function run() {
    log(`[${new Date().toISOString()}] Checking is_active behavior...`);

    // 1. No param (Default)
    await check({}, "NO PARAM (Default)");

    // 2. is_active=true
    await check({ is_active: true }, "is_active=true");

    // 3. is_active=false
    await check({ is_active: false }, "is_active=false");
}

run();
