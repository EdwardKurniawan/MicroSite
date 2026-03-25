import fs from 'fs';
import path from 'path';
import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'cFvxPQ_RgKmgpTNPe0Wq-Rf0GP2bijVxOufuHL4BLAM';
const BASE_DIR = 'C:\\Users\\edwar\\Documents\\Gemini AI Craziness\\city-guide-template\\amsterdam';

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
                            resolve(json.results[0].urls.regular + '&auto=format&fit=crop&q=80');
                        } else {
                            resolve(null);
                        }
                    } catch (e) {
                        resolve(null);
                    }
                } else {
                    console.error(`Unsplash error for query "${query}":`, body);
                    resolve(null);
                }
            });
        }).on('error', (e) => reject(e));
    });
}

function getAllDataFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllDataFiles(filePath, fileList);
        } else if (file === 'data.json') {
            fileList.push(filePath);
        }
    });
    return fileList;
}

async function processFile(filePath) {
    console.log(`Processing ${filePath}...`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    let count = 0;

    // 1. Hero Image
    if (data.hero_image) {
        const query = `${data.title} Amsterdam architecture high quality`;
        console.log(`  Updating Hero: ${query}`);
        const img = await fetchImageForQuery(query);
        if (img) { data.hero_image = img; count++; }
        await new Promise(r => setTimeout(r, 1000));
    }

    // 2. Categories (if home)
    if (data.categories) {
        for (let cat of data.categories) {
            const query = `${cat.title} Amsterdam city view`;
            console.log(`  Updating Category: ${query}`);
            const img = await fetchImageForQuery(query);
            if (img) { cat.image = img; count++; }
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    // 3. Neighbourhoods (if home)
    if (data.neighbourhoods) {
        for (let nb of data.neighbourhoods) {
            const query = `${nb.name} Amsterdam street view district`;
            console.log(`  Updating Neighbourhood: ${query}`);
            const img = await fetchImageForQuery(query);
            if (img) { nb.image = img; count++; }
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    // 4. Attractions
    if (data.attractions) {
        for (let att of data.attractions) {
            const query = `${att.name} Amsterdam building exterior`;
            console.log(`  Updating Attraction: ${query}`);
            const img = await fetchImageForQuery(query);
            if (img) { att.image_url = img; count++; }
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    // 5. Products
    if (data.products) {
        for (let prod of data.products) {
            const query = `${prod.title} Amsterdam tour photo`;
            console.log(`  Updating Product: ${query}`);
            const img = await fetchImageForQuery(query);
            if (img) { prod.image_url = img; count++; }
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    if (count > 0) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`  Updated ${count} images in ${path.basename(filePath)}`);
    }
}

(async () => {
    const dataFiles = getAllDataFiles(BASE_DIR);
    console.log(`Found ${dataFiles.length} data.json files.`);
    
    for (const file of dataFiles) {
        await processFile(file);
    }
    
    console.log("\nAll Amsterdam images refreshed with unique Unsplash content!");
})();
