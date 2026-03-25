import fs from 'fs';
import path from 'path';

const amsterdamDataPath = 'C:\\Users\\edwar\\Documents\\Gemini AI Craziness\\city-guide-template\\amsterdam\\data.json';
const ticketShopDataPath = 'C:\\Users\\edwar\\Documents\\Gemini AI Craziness\\ticket-shop\\src\\data\\amsterdam.ts';

// Helper to extract the object from the .ts file
const extractTsData = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    // Simple regex to find the object. It's exported as a constant.
    const match = content.match(/export const AMSTERDAM_DATA = (\{[\s\S]*\});/);
    if (!match) throw new Error('Could not find AMSTERDAM_DATA in ' + filePath);
    
    // We need to clean it up to make it valid JSON or use a safer eval
    // Since it's a static file we trust, we can use a small trick:
    // Convert property names without quotes to quoted ones, etc.
    // Or just use a quick and dirty eval if we're sure about the content.
    // For safety, let's just use the content and fix common JS differences.
    let jsonContent = match[1]
        .replace(/(\w+):/g, '"$1":') // quote keys
        .replace(/'/g, '"') // single quotes to double
        .replace(/,\s*([\}\]])/g, '$1'); // trailing commas
    
    try {
        return JSON.parse(jsonContent);
    } catch (e) {
        console.log("JSON Parse failed, falling back to manual extraction logic...");
        // Fallback: This is a bit risky but we are in a controlled environment.
        // We'll use a safer approach for this specific structure.
        return eval('(' + match[1] + ')');
    }
};

try {
    const currentData = JSON.parse(fs.readFileSync(amsterdamDataPath, 'utf-8'));
    const sourceData = extractTsData(ticketShopDataPath);

    console.log("Merging data...");

    // Update root level fields
    currentData.hero_h1 = sourceData.h1 || currentData.hero_h1;
    currentData.meta_title = sourceData.title || currentData.meta_title;
    currentData.meta_description = sourceData.description || currentData.meta_description;
    currentData.standfirst = sourceData.standfirst;
    currentData.author_name = sourceData.author?.name || currentData.author_name;
    currentData.updated_date = sourceData.lastUpdated || currentData.updated_date;
    currentData.intro_text = sourceData.intro; // Adding new field for intro
    currentData.faqs = sourceData.faqs;

    // Update neighbourhoods with more detail
    currentData.neighbourhoods = sourceData.neighbourhoods.map(sn => {
        const existing = currentData.neighbourhoods.find(en => en.name.toLowerCase() === sn.name.toLowerCase()) || {};
        return {
            ...existing,
            ...sn
        };
    });

    fs.writeFileSync(amsterdamDataPath, JSON.stringify(currentData, null, 2));
    console.log("Successfully synced amsterdam/data.json with ticket-shop content.");
} catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
}
