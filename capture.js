const puppeteer = require('puppeteer');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const OUT_DIR = './screenshots';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR);
}

const wait = (ms) => new Promise(r => setTimeout(r, ms));

const safeNav = async (page, url) => {
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
    await wait(1500);
  } catch(e) {
    console.error(`Error navigating to ${url}:`, e.message);
  }
};

async function run() {
  // --- Public Pages ---
  let browser = await puppeteer.launch({ headless: 'new' });
  let page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Capturing Login Page...');
  await safeNav(page, `${BASE_URL}/login`);
  await page.screenshot({ path: `${OUT_DIR}/08-login-page.png`, fullPage: true });

  console.log('Capturing Learner Registration Page...');
  await safeNav(page, `${BASE_URL}/register`);
  await page.screenshot({ path: `${OUT_DIR}/07-learner-registration-page.png`, fullPage: true });
  await browser.close();

  // --- Teacher Pages ---
  browser = await puppeteer.launch({ headless: 'new' });
  page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Logging in as Teacher...');
  await safeNav(page, `${BASE_URL}/login`);
  await page.type('input[name="email"]', 'teacher@tutortoon.com');
  await page.type('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await wait(2000);

  console.log('Capturing Teacher/Admin Dashboard...');
  await safeNav(page, `${BASE_URL}/teacher-dashboard`);
  await page.screenshot({ path: `${OUT_DIR}/06-teacher-admin-dashboard.png`, fullPage: true });
  await browser.close();

  // --- Parent & Learner Pages ---
  browser = await puppeteer.launch({ headless: 'new' });
  page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Logging in as Parent...');
  await safeNav(page, `${BASE_URL}/login`);
  await page.type('input[name="email"]', 'robert@parent.com');
  await page.type('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await wait(2000);

  console.log('Capturing Parent/Teacher Progress Report Dashboard...');
  await safeNav(page, `${BASE_URL}/parent-dashboard`);
  await page.screenshot({ path: `${OUT_DIR}/01-parent-teacher-progress-report-dashboard.png`, fullPage: true });

  console.log('Capturing Subject and Lesson Selection Screen...');
  await safeNav(page, `${BASE_URL}/learner-select`);
  
  const learnerCards = await page.$$('.ntut-profile-card');
  if (learnerCards.length > 0) {
    await learnerCards[0].click();
    await wait(3000); // Wait for API response and redirect
  } else {
    console.log('No learner profile card found');
  }
  
  await safeNav(page, `${BASE_URL}/learner-dashboard`);
  await page.screenshot({ path: `${OUT_DIR}/05-subject-and-lesson-selection-screen.png`, fullPage: true });

  console.log('Capturing Animated Lesson Playback Screen...');
  await safeNav(page, `${BASE_URL}/lesson/1`);
  await page.screenshot({ path: `${OUT_DIR}/04-animated-lesson-playback-screen.png`, fullPage: true });

  console.log('Capturing Quiz Screen...');
  await safeNav(page, `${BASE_URL}/quiz/1`);
  await page.screenshot({ path: `${OUT_DIR}/03-quiz-screen.png`, fullPage: true });

  console.log('Capturing Quiz Result / Confirmation Alert...');
  const optionBtns = await page.$$('.ntut-quiz-option-btn');
  if (optionBtns.length > 0) {
    await optionBtns[0].click();
    await wait(3000); // Wait for modal animation and fetch
    await page.screenshot({ path: `${OUT_DIR}/02-quiz-result-confirmation-alert.png`, fullPage: true });
  } else {
    console.log('No option buttons found on quiz screen');
    await page.screenshot({ path: `${OUT_DIR}/02-quiz-result-confirmation-alert-error.png`, fullPage: true });
  }

  await browser.close();
  console.log('Done.');
}

run().catch(console.error);
