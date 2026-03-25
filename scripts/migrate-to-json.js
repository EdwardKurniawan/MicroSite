const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');

const cities = ['amsterdam', 'kanazawa'];

cities.forEach(city => {
  const htmlPath = path.join(__dirname, `../${city}/index.html`);
  if (!fs.existsSync(htmlPath)) return;

  const html = fs.readFileSync(htmlPath, 'utf8');
  const $ = cheerio.load(html);

  // Parse root variables
  const getVar = (name) => {
    const match = html.match(new RegExp(`--${name}:\\s*([^;]+)`));
    return match ? match[1].trim() : null;
  };

  const data = {
    city_url: `/${city}/`,
    city_name: city.charAt(0).toUpperCase() + city.slice(1),
    meta_title: $('title').text(),
    meta_description: $('meta[name="description"]').attr('content'),
    canonical_url: $('link[rel="canonical"]').attr('href'),
    og_title: $('meta[property="og:title"]').attr('content') || $('title').text(),
    og_description: $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content'),
    og_image: $('meta[property="og:image"]').attr('content'),
    
    theme_accent: getVar('accent') || '#E8601C',
    theme_accent_dark: getVar('accent-dark') || '#B5451B',
    theme_accent_light: getVar('accent-light') || '#FDF2ED',

    country: city === 'kanazawa' ? 'Japan' : 'Netherlands', // Simplistic default
    author_name: $('.hero-meta a').first().text() || 'Editorial Team',
    author_slug: $('.hero-meta a').first().attr('href')?.split('/')[2] || 'editorial',
    updated_date: $('.hero-meta span').eq(2).text().replace('🕐 Updated ', '') || '2026',
    read_time: $('.hero-meta span').eq(3).text().replace('⏱ ', '') || '10 min read',

    hero_image: $('.hero-img').attr('src'),
    hero_alt: $('.hero-img').attr('alt'),
    hero_eyebrow: $('.hero-eyebrow').text(),
    hero_h1: $('.hero h1').text(),
    hero_tagline: $('.hero-tagline').text(),

    quick_info: [],
    intro_html: $('#intro').html()?.trim() || '',

    category_intro: $('#explore p').first().text(),
    categories: [],

    itinerary_days: 3,
    itinerary_intro: $('#itinerary p').first().text(),
    itinerary_tip_bold: $('#itinerary .tip-box strong').text().replace('💡 ', ''),
    itinerary_tip_html: $('#itinerary .tip-box').clone().children().remove().end().text().trim(),
    itinerary: [],

    neighbourhoods: [],

    weather_intro: $('#best-time p').first().text(),
    weather_note: $('#best-time p').last().text(),
    weather: [],

    tickets_intro: $('#tickets p').first().text(),

    transport_tip_bold: $('#getting-around .tip-box strong').text().replace('💡 ', ''),
    transport_tip_html: $('#getting-around .tip-box').clone().children().remove().end().text().trim(),
    transport: [],

    history_html: $('#history').clone().children('h2').remove().end().html()?.trim() || '',

    faqs: []
  };

  // Quick Info
  $('.qi-card').each((_, el) => {
    data.quick_info.push({
      icon: $(el).find('.qi-icon').text(),
      label: $(el).find('.qi-label').text(),
      value: $(el).find('.qi-value').text()
    });
  });

  // Categories
  $('.cat-card').each((_, el) => {
    data.categories.push({
      url: $(el).attr('href'),
      image: $(el).find('img').attr('src'),
      alt: $(el).find('img').attr('alt'),
      count: $(el).find('.cat-count').text(),
      title: $(el).find('h3').text(),
      description: $(el).find('p').text(),
      cta: $(el).find('.cat-btn').text().replace(' →', '')
    });
  });

  // Itinerary
  $('.itinerary-day').each((_, el) => {
    const header = $(el).find('.itinerary-day-header');
    const day = {
      day_num: header.find('.day-num').text().replace('Day ', ''),
      theme: header.find('.day-theme').text(),
      header_bg: header.css('background') || 'transparent',
      header_color: header.css('color') || 'inherit',
      header_border: false,
      slots: []
    };
    $(el).find('.itinerary-slot').each((_, slot) => {
      day.slots.push({
        time: $(slot).find('.itinerary-time').text(),
        content_html: $(slot).find('div').last().html()?.trim()
      });
    });
    data.itinerary.push(day);
  });

  // Neighbourhoods
  $('.nb-card').each((_, el) => {
    data.neighbourhoods.push({
      url: $(el).attr('href'),
      image: $(el).find('img').attr('src'),
      alt: $(el).find('img').attr('alt'),
      name: $(el).find('.nb-name').text(),
      tagline: $(el).find('.nb-tagline').text()
    });
  });

  // Weather
  $('.weather-table tbody tr').each((_, el) => {
    const tds = $(el).find('td');
    data.weather.push({
      highlight_class: $(el).attr('class') || '',
      month: $(tds[0]).text(),
      high: $(tds[1]).text(),
      low: $(tds[2]).text(),
      rain_days: $(tds[3]).text(),
      verdict: $(tds[4]).text(),
      verdict_class: $(tds[4]).find('span').attr('class')?.replace('wv ', '') || ''
    });
  });

  // Transport
  $('#getting-around > div > div').each((_, el) => {
    if (!$(el).hasClass('tip-box')) {
      data.transport.push({
        icon: $(el).find('div').first().text(),
        title: $(el).find('h3').text(),
        description: $(el).find('p').text()
      });
    }
  });

  // FAQs
  $('.faq-list details').each((_, el) => {
    data.faqs.push({
      question: $(el).find('summary').text().replace('+', '').replace('−', ''),
      answer: $(el).find('.faq-answer').text()
    });
  });

  fs.writeFileSync(path.join(__dirname, `../${city}/data.json`), JSON.stringify(data, null, 2));
  console.log(`Generated JSON for ${city}`);
});
