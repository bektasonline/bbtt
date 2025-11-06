const API_URL = 'https://www.dizibox.live/';

const getMainPage = async (url) => {
  const res = await fetch(url);
  const body = await res.text();
  const $ = new cheerio.load(body);

  const items = [];
  $('.movie-item a').each((i, el) => {
    const title = $(el).attr('title');
    const href = $(el).attr('href');
    const img = $(el).find('img').attr('src') || '';

    if (title && href) {
      items.push({
        name: title,
        url: API_URL + href,
        posterUrl: img.startsWith('http') ? img : API_URL + img
      });
    }
  });

  return { isOk: true, items };
};

const getContent = async (url) => {
  // Dizi sayfası için – bölümleri listele
  const res = await fetch(url);
  const body = await res.text();
  const $ = new cheerio.load(body);

  const seasons = [];
  $('.season-list li').each((i, el) => {
    const seasonName = $(el).text().trim();
    const episodes = [];
    $(el).find('a').each((j, ep) => {
      const epName = $(ep).text().trim();
      const epUrl = API_URL + $(ep).attr('href');
      episodes.push({ name: epName, url: epUrl });
    });
    if (episodes.length) seasons.push({ name: seasonName, episodes });
  });

  return { isOk: true, seasons };
};

const getEpisode = async (url) => {
  // Bölüm oynatma linkleri
  const res = await fetch(url);
  const body = await res.text();
  const $ = new cheerio.load(body);

  const streams = [];
  $('.player iframe').each((i, el) => {
    const src = $(el).attr('src');
    if (src) {
      streams.push({
        name: '1080p',
        url: src,
        type: 'iframe'
      });
    }
  });

  return { isOk: true, streams };
};

module.exports = { getMainPage, getContent, getEpisode };
