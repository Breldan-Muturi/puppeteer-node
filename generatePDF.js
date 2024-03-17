const puppeteer = require("puppeteer");
require("dotenv").config();

const generatePDF = async (res, req) => {
  const {path} = req.body;
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });
  try {
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      "x-puppeteer-secret": process.env.PUPPETTER_SECRET,
    });

    // Navigate the page to a URL
    const pageTemplate = await page.goto(
      `${process.env.NEXT_PUBLIC_APP_URL}/${path}`,
      {
        waitUntil: "networkidle2",
        timeout: 20000,
      }
    );

    if (!pageTemplate || pageTemplate.status() !== 200) {
      throw new Error(`Failed to load pdf template: ${pageTemplate?.status()}`);
    }

    const pdf = await page.pdf({format: "A4", printBackground: true});
    await browser.close();
    browser = null; // Ensure to set as null to prevent memory leaks

    const pdfBuffer = Buffer.from(pdf.buffer);
    return pdfBuffer;
  } catch (e) {
    console.log("Puppeteer error: ", e);
    res.send(`Something went wrong while running puppeteer: ${e}`);
  } finally {
    await browser.close();
  }
};

module.exports = {generatePDF};
