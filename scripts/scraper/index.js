const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    console.log("Navigating to https://ai-bot.cn/...");
    await page.goto('https://ai-bot.cn/', { waitUntil: 'networkidle2', timeout: 60000 });

    const html = await page.content();
    fs.writeFileSync('page.html', html);
    console.log("Saved page source to page.html");

    await browser.close();
})();
