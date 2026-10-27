const puppeteer = require('puppeteer');
const fs = require('fs');
const BASE_URL = 'http://localhost:3000';
const OUT_DIR = './screenshots';
const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Logging in as Parent...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await page.type('input[name="email"]', 'robert@parent.com');
  await page.type('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await wait(2000);
  
  await page.goto(`${BASE_URL}/learner-select`, { waitUntil: 'networkidle2' });
  const learnerCards = await page.$$('.ntut-profile-card');
  if (learnerCards.length > 0) {
    await learnerCards[0].click();
    await wait(3000); 
  }
  
  console.log('Capturing Quiz Screen (Started)...');
  await page.goto(`${BASE_URL}/quiz/1`, { waitUntil: 'networkidle2' });
  
  // Click start overlay
  await page.click('#quiz-start-overlay');
  await wait(1500);
  
  console.log('Capturing Quiz Result / Confirmation Alert...');
  const optionBtns = await page.$$('.ntut-quiz-option-btn');
  if (optionBtns.length > 0) {
    await optionBtns[0].click();
    await wait(2000); // Wait for modal animation and fetch
    await page.screenshot({ path: `${OUT_DIR}/02-quiz-result-confirmation-alert.png`, fullPage: true });
    console.log('Captured modal.');
  } else {
    console.log('No option buttons found on quiz screen');
  }

  await browser.close();
  console.log('Done.');
}
run();
