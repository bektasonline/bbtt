// dizibox.js - Geliştirilmiş Versiyon
const API_URL = 'https://www.dizibox.live';
const cache = new Map(); // Basit in-memory cache

const fetchWithTimeout = async (url, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
        'Referer': API_URL
      }
    });

    clearTimeout(id);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return await res.text();
  } catch (err) {
    clearTimeout(id);
    console.error('Fetch error:', err.message);
    return null;
  }
};

const getMainPage = async (url = API_URL) => {
  const cacheKey = `main_${url}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    const html = await fetchWithTimeout(url);
    if (!html) return { isOk: false, error: 'Bağlantı hatası' };

    const $ = require('cheerio').load(html);
    const items = [];

    $('.movie-item a').each((i, el) => {
      const title = $(el).attr('title')?.trim();
      const href = $(el).attr('href');
      const img = $(el).find('img').attr('src') || '';

      if (title && href) {
        items.push({
          name: title,
          url: new URL(href, API_URL).href,
          posterUrl: img.startsWith('http') ? img : new URL(img, API_URL).href
        });
      }
    });

    const result = { isOk: true, items };
    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    return { isOk: false, error: err.message };
  }
};

const getContent = async (url) => {
  const cacheKey = `content_${url}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    const html = await fetchWithTimeout(url);
    if (!html) return { isOk: false, error: 'Sayfa yüklenemedi' };

    const $ = require('cheerio').load(html);
    const seasons = [];

    $('.season-list li').each((i, el) => {
      const seasonName = $(el).text().trim().replace(/[^\w\s]/g, '');
      const episodes = [];

      $(el).find('a').each((j, ep) => {
        const epName = $(ep).text().trim();
        const epHref = $(ep).attr('href');
        if (epName && epHref) {
          episodes.push({
            name: epName,
            url: new URL(epHref, API_URL).href
          });
        }
      });

      if (episodes.length > 0) {
        seasons.push({ name: seasonName || `Sezon ${i + 1}`, episodes });
      }
    });

    const result = { isOk: true, seasons };
    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    return { isOk: false, error: err.message };
  }
};

const getEpisode = async (url) => {
  const cacheKey = `episode_${url}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    const html = await fetchWithTimeout(url);
    if (!html) return { isOk: false, error: 'Bölüm yüklenemedi' };

    const $ = require('cheerio').load(html);
    const streams = [];

    // 1. iframe
    $('.player iframe').each((i, el) => {
      const src = $(el).attr('src');
      if (src) {
        streams.push({
          name: 'Iframe (Muhtemelen 1080p)',
          url: src.startsWith('http') ? src : new URL(src, API_URL).href,
          type: 'iframe'
        });
      }
    });

    // 2. video source
    $('video source').each((i, el) => {
      const src = $(el).attr('src');
      const label = $(el).attr('label') || $(el).attr('title') || 'Bilinmiyor';
      const res = $(el).attr('res') || label;
      if (src) {
        streams.push({
          name: res,
          url: src.startsWith('http') ? src : new URL(src, url).href,
          type: 'direct'
        });
      }
    });

    // 3. data-src veya diğer
    $('[data-src]').each((i, el) => {
      const src = $(el).attr('data-src');
      if (src && src.includes('mp4')) {
        streams.push({
          name: 'Data SRC',
          url: src.startsWith('http') ? src : new URL(src, url).href,
          type: 'direct'
        });
      }
    });

    const result = { isOk: true, streams: streams.length > 0 ? streams : null };
    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    return { isOk: false, error: err.message };
  }
};

// Cache temizleme (isteğe bağlı)
const clearCache = () => cache.clear();

module.exports = { getMainPage, getContent, getEpisode, clearCache };
