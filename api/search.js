const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const CITY_ID_MAP = {
  amsterdam: '59840d0d-d90c-4777-9034-f29cd948768d',
  london: '20163dae-9d4b-4b2a-8363-7e38d1f1f6fa',
  rome: 'b4c8ae6e-635d-4716-8cc4-1769854a998a',
  berlin: '8fd41c31-de5b-4b7c-ba2b-3fff93c91ce2',
  kanazawa: '2ebaaaf3-f7d8-45af-9302-bce38b1a847b'
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  let pool = null;

  try {
    const { prompt, city: cityParam } = req.body;
    const citySlug = cityParam || 'amsterdam';
    const cityId = CITY_ID_MAP[citySlug];
    
    const dataPath = path.join(process.cwd(), citySlug, 'data.json');
    if (!fs.existsSync(dataPath)) {
      res.status(404).json({ error: 'City data not found' });
      return;
    }
    const cityData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    pool = process.env.DATABASE_URL
      ? new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false }
        })
      : null;

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
              for (const attr of catData.attractions) {
                const item = {
                  name: attr.name,
                  slug: attr.id,
                  type: 'ticket',
                  image: attr.image_url,
                  checkoutUrl: `/${citySlug}/${catSlug}/#${attr.id}`
                };

                if (pool && cityId) {
                  try {
                    const venueRes = await pool.query(
                      'SELECT tiqets_product_id FROM venues WHERE slug = $1 AND city_id = $2',
                      [attr.id, cityId]
                    );
                    if (venueRes.rows.length > 0 && venueRes.rows[0].tiqets_product_id) {
                      item.checkoutUrl = `/api/track-click?slug=${attr.id}&redirect=https://www.tiqets.com/en/product/${venueRes.rows[0].tiqets_product_id}/?partner=${citySlug}_insider`;
                    }
                  } catch (dbErr) {
                    console.error('Vercel search DB enrichment error:', dbErr);
                  }
                }

                allAttractions.push(item);
              }
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

    const systemPrompt = `You are ${cityData.city_name || citySlug}'s premium AI guide.
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
  } finally {
    if (pool) {
      await pool.end();
    }
  }
};
