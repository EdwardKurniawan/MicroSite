import fs from 'fs';
import path from 'path';
import https from 'https';

const ACCESS_KEY = 'cFvxPQ_RgKmgpTNPe0Wq-Rf0GP2bijVxOufuHL4BLAM';
const dataPath = 'C:\\Users\\edwar\\Documents\\Gemini AI Craziness\\city-guide-template\\amsterdam\\data.json';

const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

async function fetchImageForQuery(query) {
    return new Promise((resolve, reject) => {
        const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${ACCESS_KEY}&per_page=1&orientation=landscape`;
        
        https.get(url, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(body);
                        if (json.results && json.results.length > 0) {
                            // Using the regular size with formatting params to fit nicely
                            resolve(json.results[0].urls.regular + '&auto=format&fit=crop&q=80');
                        } else {
                            resolve(null);
                        }
                    } catch (e) {
                        resolve(null);
                    }
                } else {
                    console.error("Unsplash error:", body);
                    resolve(null);
                }
            });
        }).on('error', (e) => reject(e));
    });
}

(async () => {
    console.log("Fetching images for Categories...");
    for (let cat of data.categories) {
        if (!cat.image || typeof cat.image === 'string') { // Just replace all of them to be fresh
            const query = cat.title.split('&')[0].trim() + " Amsterdam architecture";
            console.log(`Searching: ${query}`);
            const imgUrl = await fetchImageForQuery(query);
            if (imgUrl) {
                cat.image = imgUrl;
            }
            // Small delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    console.log("Fetching images for Neighbourhoods...");
    for (let nb of data.neighbourhoods) {
        if (!nb.image || nb.image.includes('placeholder') || typeof nb.image === 'string') {
            const query = nb.name + " Amsterdam street";
            console.log(`Searching: ${query}`);
            const imgUrl = await fetchImageForQuery(query);
            if (imgUrl) {
                nb.image = imgUrl;
            }
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    // Hero image overahul just in case
    console.log("Fetching Hero Image...");
    const heroUrl = await fetchImageForQuery("Amsterdam canal romantic night high quality");
    if (heroUrl) data.hero_image = heroUrl;

    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    console.log("data.json updated successfully with new Unsplash imagery!");
})();
