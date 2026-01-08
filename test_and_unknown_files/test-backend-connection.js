// Test script to verify backend connection
const https = require("https");

const backendUrl = "https://zewunzistm.us-east-1.awsapprunner.com";

console.log("🔍 Testing TimePulse Backend Connection...");
console.log("Backend URL:", backendUrl);
console.log("");

// Test health endpoint
function testHealth() {
  return new Promise((resolve, reject) => {
    const req = https.get(`${backendUrl}/health`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        console.log("✅ Health Check:", data);
        resolve(JSON.parse(data));
      });
    });
    req.on("error", reject);
  });
}

// Test login endpoint
function testLogin() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: "pushban@selsoftinc.com",
      password: "test123#",
    });

    const options = {
      hostname: "zewunzistm.us-east-1.awsapprunner.com",
      port: 443,
      path: "/api/auth/login",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        console.log("🔐 Login Test:", data);
        resolve(JSON.parse(data));
      });
    });

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  try {
    await testHealth();
    await testLogin();
    console.log("");
    console.log("🎯 Next Steps:");
    console.log("1. Update Amplify environment variables");
    console.log("2. Redeploy frontend");
    console.log("3. Test login at: https://main.dolfu0p2owxyr.amplifyapp.com");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

runTests();


