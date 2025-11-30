const ruhend = require('ruhend-scraper');

async function test() {
    const url = "https://www.tiktok.com/@kinzakhankpk/video/7540998280008781077?is_from_webapp=1&sender_device=pc";
    try {
        const data = await ruhend.ttdl(url);
        console.log("Success:", data);
    } catch (e) {
        console.error("Error:", e.message);
    }
}

test();
