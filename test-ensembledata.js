// test-ensembledata.js
// ทดสอบ EnsembleData TikTok API
// วิธีรัน: node test-ensembledata.js <tiktok_url>
// ตัวอย่าง: node test-ensembledata.js "https://www.tiktok.com/@khaby.lame/video/7004270927972852994"

const TOKEN = "7syTihJUrSpjbKUT";

async function testPostInfo(url) {
  console.log("🔍 Testing EnsembleData TikTok Post Info API...");
  console.log("URL:", url);
  console.log("---");

  const startTime = Date.now();

  const apiUrl = `https://ensembledata.com/apis/tt/post/info?url=${encodeURIComponent(url)}&token=${TOKEN}`;

  try {
    const res = await fetch(apiUrl);
    const elapsed = Date.now() - startTime;
    const data = await res.json();

    console.log(`⏱️ Response time: ${elapsed}ms`);
    console.log(`📊 Status: ${res.status}`);

    if (data.error) {
      console.log("❌ Error:", data.error);
      return;
    }

    // Try different response structures
    const itemInfo = data.data?.itemInfos || data.data?.itemInfo?.itemStruct || data.data;
    const stats = itemInfo?.statsV2 || itemInfo?.stats || {};
    const desc = itemInfo?.desc || itemInfo?.video?.desc || "";
    const author = itemInfo?.author?.uniqueId || itemInfo?.authorInfos?.uniqueId || "";

    console.log("\n✅ Results:");
    console.log("  📝 Description:", (desc || "").substring(0, 80));
    console.log("  👤 Author:", author);
    console.log("  👀 Views:", stats.playCount || stats.viewCount || "N/A");
    console.log("  ❤️ Likes:", stats.diggCount || stats.likeCount || "N/A");
    console.log("  💬 Comments:", stats.commentCount || "N/A");
    console.log("  🔗 Shares:", stats.shareCount || "N/A");

    // Print full stats keys for debugging
    console.log("\n📋 Available stats keys:", Object.keys(stats));
    console.log("📋 Top-level data keys:", Object.keys(data.data || {}));

  } catch (e) {
    console.log("❌ Fetch error:", e.message);
  }
}

const url = process.argv[2] || "https://www.tiktok.com/@khaby.lame/video/7004270927972852994";
testPostInfo(url);
