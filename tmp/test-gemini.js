import fs from "fs";

function loadEnv() {
  const env = {};
  try {
    const content = fs.readFileSync(".env", "utf-8");
    content.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let value = match[2] || "";
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        env[match[1]] = value;
      }
    });
  } catch (err) {
    console.error("Error reading .env:", err.message);
  }
  return env;
}

const env = loadEnv();
const apiKey = env.GEMINI_API_KEY;

const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const prompt = "Reply with a JSON object: {\"message\": \"test\"}";

async function testModel(modelName) {
  console.log(`Testing model: ${modelName}...`);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: "image/png",
                    data: base64Image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    );

    console.log(`Status: ${response.status} ${response.statusText}`);
    const text = await response.text();
    console.log("Response:", text.substring(0, 200));
  } catch (err) {
    console.error(`Error:`, err);
  }
}

async function run() {
  await testModel("gemini-2.0-flash");
  console.log("\n-----------------------------------------------\n");
  await testModel("gemini-2.5-flash-image");
  console.log("\n-----------------------------------------------\n");
  await testModel("gemini-1.5-flash");
}

run();
