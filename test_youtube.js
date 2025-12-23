const ytdl = require('@distube/ytdl-core');
const ruhend = require('ruhend-scraper');

async function test() {
    console.log("--- Testing YouTube ---");
    const ytUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; // Never Gonna Give You Up (Reliable test)
    try {
        console.log("Fetching info for:", ytUrl);
        const info = await ytdl.getInfo(ytUrl);

        console.log("Title:", info.videoDetails.title);

        // Test filtering logic
        const formats = ytdl.filterFormats(info.formats, 'videoandaudio');
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
        const videoOnlyFormats = ytdl.filterFormats(info.formats, 'videoonly');

        console.log(`Found ${formats.length} muxed formats.`);
        console.log(`Found ${audioFormats.length} audio-only formats.`);
        console.log(`Found ${videoOnlyFormats.length} video-only formats.`);

        if (audioFormats.length > 0) {
            console.log("Sample Audio URL:", audioFormats[0].url);
        }
    } catch (e) {
        console.error("YouTube Error:", e.message);
    }
}

test();
