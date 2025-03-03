const express = require("express");
const puppeteer = require("puppeteer");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());

async function scrapeEmails(url) {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--window-size=1200,800",
      "--lang=en-US",
    ],
    ignoreHTTPSErrors: true,
    executablePath: "/usr/bin/google-chrome",
    defaultViewport: { width: 1200, height: 800 },
  });
  const page = await browser.newPage();

  try {
    console.log(`🔍 Sayfa açılıyorrrr: ${url}`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    console.log("Sayfa yüklendi!");
    let lastHeight = await page.evaluate("document.body.scrollHeight");
    while (true) {
      await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
      await new Promise((resolve) => setTimeout(resolve, 3000));
      let newHeight = await page.evaluate("document.body.scrollHeight");
      if (newHeight === lastHeight) break;
      lastHeight = newHeight;
    }

    console.log("📜 Sayfa aşağı kaydırıldı, içerik yüklendi!");

    const pageContent = await page.evaluate(() => document.body.innerText);

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = pageContent.match(emailRegex) || [];

    console.log(`✅ Bulunan e-postalar: ${emails}`);

    await browser.close();
    return emails;
  } catch (error) {
    console.error("❌ Hata oluştu:", error);
    await browser.close();
    return [];
  }
}

app.post("/scrape", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "Lütfen bir URL sağlayın" });
  }

  console.log(`🌐 URL alındı: ${url}`);
  const emails = await scrapeEmails(url);
  res.json({ emails });
});

app.listen(3000, () => {
  console.log(`🚀 Email Scraper Servisi ${3000} portunda çalışıyor`);
});
