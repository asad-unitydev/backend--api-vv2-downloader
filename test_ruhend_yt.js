const ruhend = require('ruhend-scraper');

async function test() {
    console.log("--- Testing Ruhend YouTube ---");
    const ytUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    try {
        console.log("Fetching ytmp4 for:", ytUrl);
        const data = await ruhend.ytmp4(ytUrl);
        console.log("Ruhend YT Result:", data ? "Success" : "Failed");
        if (data) console.log(data);
    } catch (e) {
        console.error("Ruhend YT Error:", e.message);
    }
}

test();
