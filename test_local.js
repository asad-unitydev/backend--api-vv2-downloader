const tiktok = require('tiktok-scraper-without-watermark');
const instagram = require('instagram-url-direct');
const fb = require('fb-downloader-scrapper');
const axios = require('axios');

async function test() {
    const tiktokUrl = "https://www.tiktok.com/@kinzakhankpk/video/7540998280008781077?is_from_webapp=1&sender_device=pc";
    const fbUrl = "https://www.facebook.com/share/r/17gv6Yegfi/";
    const instaUrl = "https://www.instagram.com/reel/DKcB-k0sngM/?utm_source=ig_web_copy_link";

    console.log("--- Testing TikTok ---");
    try {
        // CORRECTED: tiktokdownload
        const data = await tiktok.tiktokdownload(tiktokUrl);
        console.log("TikTok Success:", data ? "Got Data" : "No Data");
        if (data) console.log(data);
    } catch (e) {
        console.error("TikTok Error:", e.message);
    }

    console.log("\n--- Testing Facebook ---");
    try {
        // CORRECTED: getFbVideoInfo
        const data = await fb.getFbVideoInfo(fbUrl);
        console.log("Facebook Success:", data ? "Got Data" : "No Data");
        console.log(data);
    } catch (e) {
        console.error("Facebook Error:", e.message);
    }

    console.log("\n--- Testing Instagram ---");
    try {
        // CORRECTED: instagramGetUrl
        const data = await instagram.instagramGetUrl(instaUrl);
        console.log("Instagram Success:", data ? "Got Data" : "No Data");
        console.log(data);
    } catch (e) {
        console.error("Instagram Error:", e.message);
    }
}

test();
