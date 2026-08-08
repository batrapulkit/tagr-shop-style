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
const supabaseUrl = env.SUPABASE_URL || "https://qebglstoigyowpmxbucj.supabase.co";
const supabaseKey = env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_RX8_jve7bBHiKtLO4zu-GQ_Pm2cO91h";

async function check() {
  console.log("Checking uploads, items, and links in DB...");
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/uploads?select=*&order=created_at.desc&limit=3`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      }
    });

    if (!res.ok) {
      console.error("HTTP error:", res.status, await res.text());
      return;
    }

    const uploads = await res.json();
    for (const upload of uploads) {
      console.log(`\n=============================================`);
      console.log(`Upload ID: ${upload.id}`);
      console.log(`Created At: ${upload.created_at}`);

      const itemsRes = await fetch(`${supabaseUrl}/rest/v1/detected_items?upload_id=eq.${upload.id}&select=*`, {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`
        }
      });

      if (!itemsRes.ok) {
        console.error("HTTP error getting items:", await itemsRes.text());
        continue;
      }

      const items = await itemsRes.json();
      console.log(`Detected items (${items.length}):`);
      for (const item of items) {
        console.log(`  * Item ID: ${item.id}`);
        console.log(`    Category: ${item.category}, Name: "${item.name}"`);

        const linksRes = await fetch(`${supabaseUrl}/rest/v1/affiliate_links?detected_item_id=eq.${item.id}&select=*`, {
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`
          }
        });

        if (linksRes.ok) {
          const links = await linksRes.json();
          console.log(`    Affiliate links (${links.length}):`);
          links.forEach(l => {
            console.log(`      - Short code: ${l.short_code}, Target: ${l.original_url}`);
          });
        } else {
          console.error("    Error logging link:", await linksRes.text());
        }
      }
    }
  } catch (err) {
    console.error("Trace error:", err);
  }
}

check();
