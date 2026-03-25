const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { prompt, city: cityParam } = req.body;
    const citySlug = cityParam || 'amsterdam';
    
    // In Vercel, files in the root are available via process.cwd()
    const dataPath = path.join(process.cwd(), citySlug, 'data.json');
    
    if (!fs.existsSync(dataPath)) {
      res.status(404).json({ error: 'City data not found' });
      return;
    }

    const cityData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Extract free gems from quick_info
    const freeGems = (cityData.quick_info || [])
      .filter(info => info.value.toLowerCase().includes('free'))
      .map(info => ({ name: info.label, description: info.value, type: 'free' }));

    const inventory = [
      ...(cityData.categories || []).map(c => ({ name: c.title, slug: c.url.replace(/\//g, ''), type: 'ticket' })),
      ...(cityData.neighbourhoods || []).map(n => ({ name: n.name, slug: n.slug, type: 'neighbourhood' })),
      ...freeGems
    ];

    const systemPrompt = `You are AmsterdamInsider's premium AI guide.
CRITICAL: You MUST return a JSON object with a "steps" array. Do NOT use an "items" array.
Format:
{
  "summary": "Catchy headline",
  "themeColor": "Hex code (e.g. #E8601C)",
  "steps": [
    { 
      "time": "Morning/Afternoon/Evening",
      "name": "Activity Name",
      "type": "FREE or TICKET or NEIGHBOURHOOD",
      "description": "Short narrative",
      "slug": "matching-slug"
    }
  ]
}
1. Create a 1-day journey.
2. Mix FREE and TICKET items from inventory:
${JSON.stringify(inventory, null, 2)}`;

    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "nvidia/nemotron-3-nano-30b-a3b:free",
        "messages": [
          { "role": "system", "content": systemPrompt },
          { "role": "user", "content": prompt }
        ]
      })
    });

    const aiData = await aiResponse.json();
    
    if (!aiData.choices || !aiData.choices[0]) {
      console.error("AI Response error:", aiData);
      res.status(500).json({ error: 'AI failed to respond' });
      return;
    }

    const content = aiData.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const cleaned = jsonMatch ? jsonMatch[0] : content;
    
    res.status(200).json(JSON.parse(cleaned));
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}
