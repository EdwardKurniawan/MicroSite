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
    
    const dataPath = path.join(process.cwd(), citySlug, 'data.json');
    if (!fs.existsSync(dataPath)) {
      res.status(404).json({ error: 'City data not found' });
      return;
    }
    const cityData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // Extract granular attractions from category subdirectories
    const allAttractions = [];
    if (cityData.categories) {
      for (const cat of cityData.categories) {
        const catSlug = cat.url.replace(/\//g, '');
        const catDataPath = path.join(process.cwd(), citySlug, catSlug, 'data.json');
        if (fs.existsSync(catDataPath)) {
          try {
            const catData = JSON.parse(fs.readFileSync(catDataPath, 'utf8'));
            if (catData.attractions) {
              catData.attractions.forEach(attr => {
                allAttractions.push({
                  name: attr.name,
                  slug: attr.id,
                  type: 'ticket',
                  image: attr.image_url,
                  checkoutUrl: `/${citySlug}/${catSlug}/#${attr.id}`
                });
              });
            }
          } catch (e) {}
        }
      }
    }

    // Extract free gems from quick_info
    const freeGems = (cityData.quick_info || [])
      .filter(info => info.value.toLowerCase().includes('free'))
      .map(info => ({ name: info.label, description: info.value, type: 'free' }));

    const inventory = [
      ...allAttractions,
      ...(cityData.neighbourhoods || []).map(n => ({ 
        name: n.name, 
        slug: n.slug, 
        type: 'neighbourhood',
        image: n.image
      })),
      ...freeGems
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
      "time": "Morning/Afternoon/Evening",
      "name": "Activity Name",
      "type": "FREE or TICKET or NEIGHBOURHOOD",
      "description": "Short narrative",
      "slug": "matching-slug",
      "image": "image url from inventory",
      "checkoutUrl": "checkoutUrl from inventory"
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
    const parsed = JSON.parse(cleaned);

    // Insurance: Map 'items' to 'steps' if AI slips up
    if (parsed.items && !parsed.steps) {
      parsed.steps = parsed.items;
      delete parsed.items;
    }
    
    res.status(200).json(parsed);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}
