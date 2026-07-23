import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const email = `coach${Date.now()}@example.com`;
const password = "password123";

function log(step) {
  console.log(`\n=== ${step} ===`);
}

async function main() {
  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") console.log("CONSOLE ERROR:", msg.text());
  });

  log("Sign up");
  await page.goto(`${BASE}/signup`);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button:has-text("Create Account")');
  await page.waitForURL(`${BASE}/teams`);
  console.log("OK: signed up and redirected to /teams");

  log("Create Team A (8U / new)");
  await page.click('button:has-text("Create Your First Team")');
  await page.waitForURL(`${BASE}/teams/new`);
  await page.fill("#name", "Rockies 8U");
  await page.selectOption("#ageRange", "8U");
  await page.selectOption("#skillLevel", "new");
  await page.click('button:has-text("Create Team")');
  await page.waitForURL((url) => /\/teams\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith("/new"));
  const teamAUrl = page.url();
  const teamAId = teamAUrl.split("/").pop();
  console.log("OK: team A created at", teamAUrl);

  log("Attempt to create Team B (should be blocked, free tier)");
  await page.goto(`${BASE}/teams`);
  const upgradeVisible = await page.locator("text=limited to 1 team").count();
  console.log(upgradeVisible > 0 ? "OK: team limit banner shown" : "WARN: no team limit banner");

  log("Start a new practice for Team A");
  await page.goto(teamAUrl);
  await page.click('a:has-text("New Practice")');
  await page.waitForURL(/practices\/new$/);
  await page.fill("#title", "Week 1 Practice");
  await page.click('button:has-text("Start Building Blocks")');
  await page.waitForURL(/practices\/[^/]+\/edit$/);
  console.log("OK: practice created, in builder at", page.url());

  log("Add a Warm-Up block and check no static stretching for 8U");
  await page.getByRole("button", { name: "Warm-Up", exact: true }).click();
  await page.click('button:has-text("Add Warm-Up Block")');
  await page.waitForTimeout(800);
  const bodyText1 = await page.textContent("body");
  console.log(
    /static stretch/i.test(bodyText1)
      ? "FAIL: static stretching text found for 8U!"
      : "OK: no static stretching text for 8U warm-up",
  );

  log("Add a Pitching block and check Pitch Smart 50 note for 6U-8U");
  await page.getByRole("button", { name: "Pitching", exact: true }).click();
  await page.click('button:has-text("Add Pitching Block")');
  await page.waitForTimeout(800);
  const bodyText2 = await page.textContent("body");
  console.log(
    /50 pitches\/day/i.test(bodyText2)
      ? "OK: Pitch Smart 50/day note shown for 6U-8U"
      : "FAIL: Pitch Smart note missing/wrong for 6U-8U",
  );

  log("Add a Hitting block");
  await page.getByRole("button", { name: "Hitting", exact: true }).click();
  await page.click('button:has-text("Add Hitting Block")');
  await page.waitForTimeout(800);

  const stackedBarText = await page.locator("text=min allocated").first().textContent();
  console.log("Time bar status:", stackedBarText);

  log("Swap a drill in a block");
  const swapButtons = page.locator('button:has-text("Swap")');
  const swapCount = await swapButtons.count();
  console.log("Swap buttons found:", swapCount);
  if (swapCount > 0) {
    await swapButtons.first().click();
    await page.waitForTimeout(600);
    console.log("OK: clicked swap");
  }

  log("View practice summary");
  await page.click('button:has-text("View Practice Summary")');
  await page.waitForURL(/practices\/[^/]+$/);
  console.log("OK: summary view at", page.url());
  const summaryText = await page.textContent("body");
  console.log(
    summaryText.includes("Week 1 Practice") ? "OK: summary shows title" : "FAIL: title missing",
  );

  log("Attempt duplicate + PDF export on free plan (should be locked)");
  const lockedButtons = await page.locator('button:has-text("🔒"), a:has-text("🔒")').count();
  console.log(lockedButtons >= 1 ? `OK: ${lockedButtons} locked paid-feature button(s) shown` : "WARN: no locked buttons found");

  log("Create a 2nd practice (2/2 allowed on free)");
  await page.goto(teamAUrl);
  await page.click('a:has-text("New Practice")');
  await page.waitForURL(/practices\/new$/);
  await page.click('button:has-text("Start Building Blocks")');
  await page.waitForURL(/practices\/[^/]+\/edit$/);
  console.log("OK: 2nd practice created");

  log("Attempt a 3rd practice (should be blocked)");
  await page.goto(teamAUrl);
  await page.click('a:has-text("New Practice")');
  await page.waitForURL(/practices\/new$/);
  const blockedText = await page.textContent("body");
  console.log(
    /limited to 2 saved practices/i.test(blockedText)
      ? "OK: 3rd practice correctly blocked with upgrade message"
      : "FAIL: 3rd practice was not blocked",
  );

  log("Upgrade to paid (mock)");
  await page.goto(`${BASE}/settings/upgrade`);
  await page.click('button:has-text("Upgrade — $")');
  await page.waitForURL(`${BASE}/settings`);
  const settingsText = await page.textContent("body");
  console.log(settingsText.includes("Paid") ? "OK: plan shows Paid after upgrade" : "FAIL: plan not updated");

  log("Re-attempt Team B creation (should now work)");
  await page.goto(`${BASE}/teams/new`);
  await page.fill("#name", "Braves 12U");
  await page.selectOption("#ageRange", "12U");
  await page.selectOption("#skillLevel", "competitive");
  await page.click('button:has-text("Create Team")');
  await page.waitForURL((url) => /\/teams\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith("/new"));
  const teamBUrl = page.url();
  console.log("OK: team B created at", teamBUrl);

  log("Value-prop check: compare Hitting suggestions, 8U/new vs 12U/competitive");
  await page.goto(teamBUrl);
  await page.click('a:has-text("New Practice")');
  await page.waitForURL(/practices\/new$/);
  await page.click('button:has-text("Start Building Blocks")');
  await page.waitForURL(/practices\/[^/]+\/edit$/);
  await page.getByRole("button", { name: "Hitting", exact: true }).click();
  await page.click('button:has-text("Add Hitting Block")');
  await page.waitForTimeout(800);
  const teamBDrillNames = await page.locator(".font-bold").allTextContents();
  console.log("Team B (12U/competitive) hitting drill names on page:", JSON.stringify(teamBDrillNames.slice(0, 6)));

  log("Duplicate practice as paid user");
  await page.goto(`${BASE}/teams/${teamAId}/practices`);
  const dupButton = page.locator('button:has-text("Duplicate")').first();
  if (await dupButton.count()) {
    await dupButton.click();
    await page.waitForURL(/practices\/[^/]+\/edit$/, { timeout: 5000 }).catch(() => {});
    console.log("OK: duplicate flow triggered, now at", page.url());
  } else {
    console.log("WARN: no duplicate button found");
  }

  log("PDF export as paid user");
  await page.goto(`${BASE}/teams/${teamAId}/practices`);
  await page.locator('a:has-text("Week 1 Practice")').first().click();
  await page.waitForURL(/practices\/[^/]+$/);
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 5000 }).catch(() => null),
    page.click('button:has-text("Export PDF")'),
  ]);
  console.log(download ? `OK: PDF downloaded (${download.suggestedFilename()})` : "WARN: no download event captured");

  await browser.close();
  console.log("\n=== SMOKE TEST COMPLETE ===");
}

main().catch((err) => {
  console.error("SMOKE TEST FAILED:", err);
  process.exit(1);
});
