const axios = require('axios');

const BASE_URL = "https://neon-downloader-api-v2-asad.netlify.app/api";

const samples = {
    tiktok: "https://www.tiktok.com/@kinzakhankpk/video/7540998280008781077",
    facebook: "https://www.facebook.com/share/r/17gv6Yegfi/",
    instagram: "https://www.instagram.com/reel/DKcB-k0sngM/",
    youtube: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
};

async function testEndpoint(platform, url) {
    console.log(`\n--- Testing ${platform} ---`);
    try {
        const apiUrl = `${BASE_URL}/${platform}?url=${encodeURIComponent(url)}`;
        console.log(`Requesting: ${apiUrl}`);
        const start = Date.now();
        const response = await axios.get(apiUrl);
        const duration = Date.now() - start;

        console.log(`Status: ${response.status} (${duration}ms)`);
        console.log("Response Data Preview:", JSON.stringify(response.data.downloads ? response.data.downloads.length + " downloads found" : response.data, null, 2));

        if (response.data.downloads && response.data.downloads.length > 0) {
            console.log("SUCCESS: Got download links!");
            response.data.downloads.slice(0, 2).forEach(d => console.log(`- [${d.type}] ${d.quality} (${d.ext}): ${d.url.substring(0, 50)}...`));
        } else {
            console.log("WARNING: No downloads array found or empty.");
        }

    } catch (error) {
        console.error(`FAILED: ${error.message}`);
        if (error.response) {
            console.error("Server Error Data:", error.response.data);
        }
    }
}

async function runTests() {
    console.log(`Targeting API: ${BASE_URL}`);
    // Check root
    try {
        const rootRes = await axios.get("https://neon-downloader-api-v2-asad.netlify.app/.netlify/functions/api");
        console.log("Root Health Check:", rootRes.data);
    } catch (e) { console.error("Root check failed:", e.message); }

    await testEndpoint('tiktok', samples.tiktok);
    await testEndpoint('youtube', samples.youtube);
    // FB and Insta links might be expired, but we try
    // await testEndpoint('facebook', samples.facebook); 
    // await testEndpoint('instagram', samples.instagram);
}

runTests();
