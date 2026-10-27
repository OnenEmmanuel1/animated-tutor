const puppeteer = require('puppeteer');
const fs = require('fs');
const OUT_DIR = './screenshots';
const BASE_URL = 'http://localhost:3000';
const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Parent/Teacher Progress Report Dashboard (parent-dashboard)
  await page.goto(`${BASE_URL}/logout`);
  await page.goto(`${BASE_URL}/login`);
  await page.type('input[name="email"]', 'robert@parent.com');
  await page.type('input[name="password"]', 'password123');
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(e => console.log('nav error', e))
  ]);
  console.log('Parent Dashboard URL:', page.url());
  await page.screenshot({ path: `${OUT_DIR}/01-parent-teacher-progress-report-dashboard.png`, fullPage: true });

  // 2. Subject and Lesson Selection Screen (learner-dashboard)
  await page.goto(`${BASE_URL}/learner-select`, {waitUntil: 'networkidle2'});
  console.log('Learner Select URL:', page.url());
  
  const learnerLinks = await page.$$('a[href^="/api/auth/set-learner/"]');
  if (learnerLinks.length > 0) {
    await Promise.all([
      learnerLinks[0].click(),
      page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(e=>console.log(e))
    ]);
  } else {
    await page.goto(`${BASE_URL}/api/auth/set-learner/1`);
  }
  await page.goto(`${BASE_URL}/learner-dashboard`, {waitUntil: 'networkidle2'});
  console.log('Learner Dashboard URL:', page.url());
  await page.screenshot({ path: `${OUT_DIR}/05-subject-and-lesson-selection-screen.png`, fullPage: true });

  // 3. Animated Lesson Playback Screen
  await page.goto(`${BASE_URL}/lesson/1`, {waitUntil: 'networkidle2'});
  console.log('Lesson URL:', page.url());
  await page.screenshot({ path: `${OUT_DIR}/04-animated-lesson-playback-screen.png`, fullPage: true });

  // 4. Quiz Screen
  await page.goto(`${BASE_URL}/quiz/1`, {waitUntil: 'networkidle2'});
  console.log('Quiz URL:', page.url());
  await wait(1000);
  await page.screenshot({ path: `${OUT_DIR}/03-quiz-screen.png`, fullPage: true });

  // 5. Quiz Result / Confirmation Alert
  const optionBtns = await page.$$('.ntut-quiz-option-btn');
  if (optionBtns.length > 0) {
    await optionBtns[0].click();
    await wait(2000);
    await page.screenshot({ path: `${OUT_DIR}/02-quiz-result-confirmation-alert.png`, fullPage: true });
  }

  await browser.close();
  console.log('Done.');
}
run();
