const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function testSearch() {
  const citySlug = 'amsterdam';
  const DIR = process.cwd();
  
  const cityData = JSON.parse(fs.readFileSync(path.join(DIR, citySlug, 'data.json'), 'utf8'));
  
  // Minimal inventory for test
  const inventory = [
    { name: "Rijksmuseum", slug: "rijksmuseum", type: "ticket", image: "/images/rijksmuseum.png", checkoutUrl: "/amsterdam/museums/#rijksmuseum" },
    { name: "Vondelpark", description: "Free park", type: "free" }
  ];

  const systemPrompt = `You are AmsterdamInsider's premium AI guide.
CRITICAL: Return a JSON object with a "steps" array. 
For each step, include "image" and "checkoutUrl" from inventory if applicable.
Format:
{
  "summary": "Catchy headline",
  "themeColor": "Hex code",
  "steps": [
    { 
      "time": "Evening",
      "name": "Activity Name",
      "type": "FREE or TICKET or NEIGHBOURHOOD",
      "description": "Short narrative",
      "slug": "matching-slug",
      "image": "image url from inventory",
      "checkoutUrl": "checkoutUrl from inventory"
    }
  ]
}
Inventory:
${JSON.stringify(inventory, null, 2)}`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "model": "nvidia/nemotron-3-nano-30b-a3b:free",
      "messages": [
        { "role": "system", "content": systemPrompt },
        { "role": "user", "content": "1 day in amsterdam" }
      ]
    })
  });

  const data = await response.json();
  const content = data.choices[0].message.content;
  console.log("RAW CONTENT:\n", content);
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
  console.log("\nPARSED KEYS:", Object.keys(parsed));
  if (parsed.steps) console.log("STEPS COUNT:", parsed.steps.length);
  if (parsed.items) console.log("ITEMS COUNT:", parsed.items.length);
}

testSearch().catch(console.error);
