const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const CITY_NAME = process.argv[2] || 'amsterdam';
const CITY_DIR = path.join(__dirname, '..', CITY_NAME);

if (!fs.existsSync(CITY_DIR)) {
  console.error(`Error: City directory not found at ${CITY_DIR}`);
  process.exit(1);
}

function parseLegacyPage(dirName) {
  const htmlPath = path.join(CITY_DIR, dirName, 'index.html');
  if (!fs.existsSync(htmlPath)) return null;

  console.log(`Parsing legacy content for: ${dirName}...`);
  const html = fs.readFileSync(htmlPath, 'utf8');
  const $ = cheerio.load(html);

  // Extract Hero Details
  const hero_h1 = $('.hero h1, .page-hero-content h1').first().text().trim();
  const hero_eyebrow = $('.hero-eyebrow').first().text().trim();
  const hero_image = $('.hero-img, .page-hero-img').attr('src');
  const hero_standfirst = $('.hero-tagline, .hero-standfirst').first().text().trim();
  
  // Extract Intro
  let intro_html = '';
  $('.intro p, .content-wrap > p').first().each((i, el) => {
    // Only take the first few paragraphs as intro if needed, or all in .intro
    if ($(el).parents('.intro').length > 0) {
      intro_html += `<p class="mb-4">${$(el).html()}</p>`;
    }
  });
  if (!intro_html) {
    $('.intro p').each((i, el) => {
      intro_html += `<p class="mb-4">${$(el).html()}</p>`;
    });
  }

  // 1. Extract Quick Facts / Facts
  const facts = [];
  $('.qi-card, .trip-meta-item, .market-detail-item, .nb-fact').each((i, el) => {
    const $el = $(el);
    const label = $el.find('.qi-label, .tm-label, .label, .nb-fact-label').text().trim();
    const value = $el.find('.qi-value, .tm-value, .value, .nb-fact-value').text().trim();
    const icon = $el.find('.qi-icon, .ti-icon, .nb-fact-icon').text().trim();
    if (label && value) {
      facts.push({ label, value, icon: icon || null });
    }
  });

  // 2. Extract Attractions / Cards
  const attractions = [];
  const attractionSelector = '.attraction, .also-card, .highlight-card, .trip-card, .food-card, .drink-card, .thing-item, .eat-card, .nb-card';
  
  $(attractionSelector).each((i, el) => {
    const $el = $(el);
    const id = $el.attr('id') || `item-${i}`;
    
    let name = $el.find('h2, h3, .trip-card-img-label, .eat-name, .nb-name').first().text().trim();
    if (!name && $el.hasClass('highlight-card')) name = $el.find('.qi-card-title').text().trim();
    if (!name) name = `Item ${i + 1}`;

    const category = $el.find('.attraction-cat, .venue-cat, .trip-card-img-badge, .food-season, .thing-badge, .eat-cuisine').first().text().trim();
    const badge = $el.find('.attraction-badge').text().trim();
    
    let image_url = $el.find('img').attr('src');
    if (image_url && !image_url.startsWith('http')) {
      image_url = image_url.startsWith('/') ? image_url : `/${image_url}`;
    }
    
    let description = '';
    const pTags = $el.find('p').filter((_, p) => !$(p).parents('.tip-box, .trip-meta-item, .market-detail-item').length);
    pTags.each((_, p) => {
      description += `<p class="mb-4">${$(p).html()}</p>`;
    });

    const listItems = [];
    $el.find('ul.trip-list li').each((_, li) => {
      listItems.push($(li).html().trim());
    });
    if (listItems.length > 0) {
      description += '<ul class="list-disc pl-5 mb-4">' + listItems.map(item => `<li>${item}</li>`).join('') + '</ul>';
    }

    attractions.push({
      id,
      name,
      category: category || null,
      badge: badge || null,
      image_url: image_url || null,
      description
    });
  });

  // 3. Getting there (if not in facts)
  const getting_there = [];
  const gtSelector = '.gt-item, .transport-row, .transport-item, .transport-card';
  $(gtSelector).each((_, el) => {
    const $el = $(el);
    getting_there.push({
      icon: $el.find('.gt-icon, .transport-icon, .ti-icon').text().trim(),
      title: $el.find('h3').text().trim(),
      text: $el.find('p, span').last().text().trim()
    });
  });

  // 4. FAQs
  const faqs = [];
  $('details').each((_, el) => {
    faqs.push({
      question: $(el).find('summary').text().replace(/[+−]/g, '').trim(),
      answer: $(el).find('.faq-answer').html() || $(el).text().replace($(el).find('summary').text(), '').trim()
    });
  });

  const data = {
    title: hero_h1,
    eyebrow: hero_eyebrow,
    standfirst: hero_standfirst,
    hero_image,
    intro_html,
    attractions,
    facts,
    getting_there,
    faqs
  };

  const outPath = path.join(CITY_DIR, dirName, 'data.json');
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(`✓ Saved ${attractions.length} attractions and ${facts.length} facts to ${dirName}/data.json\n`);
  
  return data;
}

function run() {
  const entries = fs.readdirSync(CITY_DIR, { withFileTypes: true });
  let count = 0;
  for (let entry of entries) {
    if (entry.isDirectory() && entry.name !== 'images') {
      const parsed = parseLegacyPage(entry.name);
      if (parsed) count++;
    }
  }
  console.log(`Migration complete! Processed ${count} legacy directories.`);
}

run();
