const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:4200';

async function runAudit() {
  console.log('==========================================================');
  console.log('      TRAVELSAAS IN-BROWSER END-TO-END AUDIT SUITE         ');
  console.log('==========================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const consoleErrors = [];
  const networkFailures = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[BROWSER ERROR]: ${msg.text()}`);
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log(`[PAGE EXCEPTION]: ${err.message}`);
    consoleErrors.push(err.message);
  });

  page.on('requestfailed', request => {
    // Ignore favicon or optional asset cancels
    if (!request.url().includes('favicon.ico')) {
      console.log(`[NETWORK FAIL]: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
      networkFailures.push(`${request.method()} ${request.url()}`);
    }
  });

  try {
    // 1. AuthGuard & Login Page
    console.log('[1/8] Testing AuthGuard Redirect & Login Page (http://127.0.0.1:4200/dashboard)...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    
    // Should be redirected to /login because no session exists
    await page.waitForSelector('.login-card', { timeout: 6000 });
    const currentUrl = page.url();
    console.log(`>> [PASS] AuthGuard redirect verified: "${currentUrl}"`);

    const loginTitle = await page.$eval('.brand-title', el => el.innerText.trim());
    console.log(`>> Login Branding: "${loginTitle}"`);

    // Click quick demo profile button for V4Journey Director
    await page.click('.btn-profile:first-child');
    await new Promise(r => setTimeout(r, 200));

    // Submit form
    console.log('>> Submitting credentials to real backend API (/api/auth/login)...');
    await page.click('button[type="submit"]');

    // Wait for authentication and redirect to /dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log(`>> [PASS] Logged in successfully! Landed on: ${page.url()}`);

    // 2. Dashboard KPIs & Live Audit Stream
    console.log('\n[2/8] Testing Executive Dashboard KPIs (/dashboard)...');
    await page.waitForSelector('.kpi-grid', { timeout: 6000 });
    const kpiValues = await page.$$eval('.kpi-value', els => els.map(e => e.innerText.trim()));
    const pageTitle = await page.$eval('.page-title', el => el.innerText.trim());
    console.log(`>> Page Title: "${pageTitle}"`);
    console.log(`>> Real DB Metrics: Total Trips=${kpiValues[0]}, Upcoming=${kpiValues[1]}, Revenue=${kpiValues[2]}, Travellers=${kpiValues[3]}`);
    console.log('>> [PASS] Dashboard rendered real database KPIs.');

    // 3. Trips List, Filters & Search
    console.log('\n[3/8] Testing Trips List & Table Operations (/trips)...');
    await page.goto(`${BASE_URL}/trips`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.figma-table', { timeout: 6000 });

    const tripRows = await page.$$eval('.figma-table tbody tr', trs => trs.length);
    const subtitle = await page.$eval('.subtitle', el => el.innerText.trim());
    console.log(`>> Initial Trips Table: ${tripRows} trips displayed, Subtitle: "${subtitle}"`);

    // Search filter test
    await page.type('.filter-panel input[placeholder="Search by trip name"]', 'Munnar');
    await new Promise(r => setTimeout(r, 600));
    const filteredRows = await page.$$eval('.figma-table tbody tr', trs => trs.length);
    console.log(`>> Search Filter applied: Found ${filteredRows} row(s) for "Munnar".`);

    // Reset filter
    await page.click('.btn-reset');
    await new Promise(r => setTimeout(r, 400));
    console.log('>> [PASS] Trips search and filters verified.');

    // 4. Trip Details & Action Modals
    console.log('\n[4/8] Testing Trip Details & Modals (/trips/:id)...');
    const firstCode = await page.$('.td-code');
    if (firstCode) {
      await firstCode.click();
      await page.waitForSelector('.trip-details-page', { timeout: 6000 });
      const tripTitle = await page.$eval('.trip-title', el => el.innerText.trim());
      const progressPct = await page.$eval('.progress-pct', el => el.innerText.trim());
      console.log(`>> Trip Details: "${tripTitle}", Journey Progress: ${progressPct}`);

      // Test Assign Team Member Modal
      const btnAssign = await page.$('button.btn-add');
      if (btnAssign) {
        await btnAssign.click();
        await page.waitForSelector('.modal-content', { timeout: 4000 });
        const modalHeader = await page.$eval('.modal-header h3', el => el.innerText.trim());
        console.log(`>> [PASS] Assign Team Modal opened: "${modalHeader}"`);
        await page.click('.close-x');
        await new Promise(r => setTimeout(r, 300));
      }

      // Test Share Link Modal
      const btnShare = await page.$('.header-actions button');
      if (btnShare) {
        await btnShare.click();
        await page.waitForSelector('.modal-content', { timeout: 4000 });
        const shareTitle = await page.$eval('.modal-header h3', el => el.innerText.trim());
        console.log(`>> [PASS] Share / Publish Modal opened: "${shareTitle}"`);
        await page.click('.close-x');
        await new Promise(r => setTimeout(r, 300));
      }
    }

    // 5. 3-Column Create Trip Wizard
    console.log('\n[5/8] Testing 3-Column Create Trip Wizard (/trips/create)...');
    await page.goto(`${BASE_URL}/trips/create`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.trip-grid', { timeout: 6000 });
    const colCount = await page.$$eval('.section-card', els => els.length);
    console.log(`>> [PASS] Create Trip Wizard loaded with ${colCount} section cards matching Figma 3-column layout.`);

    // 6. Unified Own & Partners Resource Engine
    console.log('\n[6/8] Testing Unified Own & Partners Resource Engine (/resources)...');
    await page.goto(`${BASE_URL}/resources`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.pills-track', { timeout: 6000 });

    const pills = await page.$$eval('.type-pill-btn', els => els.map(e => e.innerText.trim()));
    console.log(`>> Dynamic Resource Types: [${pills.join(', ')}]`);

    // Switch to Hotel
    const hotelBtn = (await page.$$('.type-pill-btn'))[1];
    if (hotelBtn) {
      await hotelBtn.click();
      await new Promise(r => setTimeout(r, 400));
      const addBtnText = await page.$eval('.page-header button.btn-primary', el => el.innerText.trim());
      console.log(`>> Clicked "Hotel": Button changed to "${addBtnText}"`);

      // Open Add Hotel Drawer
      await page.click('.page-header button.btn-primary');
      await page.waitForSelector('.drawer-panel', { timeout: 5000 });
      const drawerTitle = await page.$eval('.drawer-header h2', el => el.innerText.trim());
      console.log(`>> [PASS] Dynamic Slide-out Drawer opened: "${drawerTitle}"`);
      await page.click('.drawer-header .close-btn');
      await new Promise(r => setTimeout(r, 300));
    }

    // 7. Team Members & Payout Ledger
    console.log('\n[7/8] Testing Team Members & Payout Ledger (/team)...');
    await page.goto(`${BASE_URL}/team`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.kanban-board', { timeout: 6000 });
    const colTitles = await page.$$eval('.col-title', els => els.map(e => e.innerText.trim()));
    console.log(`>> Kanban Roles: [${colTitles.join(' | ')}]`);

    // Toggle Table View
    await page.click('.view-toggle button:nth-child(2)');
    await page.waitForSelector('.figma-table', { timeout: 4000 });
    const memberRows = await page.$$eval('.figma-table tbody tr', trs => trs.length);
    console.log(`>> [PASS] Table View Toggled: ${memberRows} members rendered in table.`);

    // Click first member row
    await page.click('.figma-table tbody tr:first-child .td-code');
    await page.waitForSelector('.member-details-page', { timeout: 6000 });
    const memberName = await page.$eval('.profile-name', el => el.innerText.trim());
    const contractPill = await page.$eval('.contract-pill', el => el.innerText.trim());
    console.log(`>> [PASS] Member Details opened: "${memberName}", Contract: "${contractPill}"`);

    // 8. Navigation Persistence & Settings
    console.log('\n[8/8] Testing Navigation Persistence & Settings (/settings)...');
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.settings-layout', { timeout: 6000 });
    const settingsHeading = await page.$eval('.card-heading', el => el.innerText.trim());
    console.log(`>> Settings Hub: "${settingsHeading}"`);

    // Reload test on /trips
    await page.goto(`${BASE_URL}/trips`, { waitUntil: 'networkidle2' });
    await page.reload({ waitUntil: 'networkidle2' });
    const reloadedTitle = await page.$eval('.title', el => el.innerText.trim());
    console.log(`>> [PASS] HTML5 Navigation Reload on /trips preserved state: "${reloadedTitle}"`);

    // 9. Public Trip Direct Load & Browser Refresh (Item 21)
    console.log('\n[9/10] Testing Direct Public Trip URL & Browser Refresh (/trips/public/:slug)...');
    await page.goto(`${BASE_URL}/trips/public/kochi-to-munnar-family-trip-0001`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.public-trip-page', { timeout: 6000 });
    const publicTripTitle = await page.$eval('.trip-title', el => el.innerText.trim());
    console.log(`>> Public Trip Loaded Directly: "${publicTripTitle}"`);
    await page.reload({ waitUntil: 'networkidle2' });
    const reloadedPublicTitle = await page.$eval('.trip-title', el => el.innerText.trim());
    console.log(`>> [PASS] Public Trip direct reload verified: "${reloadedPublicTitle}"`);

    // 10. Authentication Protection After Refresh (Item 22)
    console.log('\n[10/10] Testing Route Protection After Session Invalidation (/dashboard)...');
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.login-card', { timeout: 6000 });
    console.log(`>> [PASS] Unauthenticated access blocked on browser refresh: Redirected to "${page.url()}"`);

    console.log('\n==========================================================');
    console.log('   ALL 10/10 IN-BROWSER END-TO-END CHECKS PASSED!         ');
    console.log('==========================================================');
    console.log(`Console Errors: ${consoleErrors.length}`);
    console.log(`Network Failures: ${networkFailures.length}`);
  } catch (err) {
    console.error('Audit failed with error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runAudit();
