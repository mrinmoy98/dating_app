
// const BUCKET_URL = "https://christtube-com.s3.us-east-1.amazonaws.com";
const BUCKET_URL = "https://sts-christtube-dev.s3.ap-south-1.amazonaws.com";
const TEST_KEY = "vapt-write-test.txt";


const objectUrl = `${BUCKET_URL}/${TEST_KEY}`;

const payload = Buffer.from(`vapt anonymous write test @ ${new Date().toISOString()}\n`);

async function hit(label, url, options) {
  try {
    const res = await fetch(url, options);
    const body = await res.text();
    const verdict = res.ok ? "⚠️  ALLOWED" : "✅ blocked";
    console.log(`\n[${label}] ${options.method} ${url}`);
    console.log(`   -> HTTP ${res.status} ${res.statusText}   ${verdict}`);
    if (body.trim()) console.log(`   -> body: ${body.trim().slice(0, 200)}`);
    return res.status;
  } catch (err) {
    console.log(`\n[${label}] ERROR: ${err.message}`);
    return null;
  }
}

async function run() {
  console.log("Target bucket:", BUCKET_URL);
  console.log("Test object  :", TEST_KEY);

  await hit("WRITE", objectUrl, {
    method: "PUT",
    headers: { "Content-Type": "text/plain" },
    body: payload,
  });

  await hit("READ", objectUrl, { method: "GET" });

  await hit("LIST", `${BUCKET_URL}/`, { method: "GET" });

  await hit("DELETE", objectUrl, { method: "DELETE" });

  console.log("\nDone. Any '⚠️  ALLOWED' line is a misconfiguration to fix.");
}

run().catch(console.error);
