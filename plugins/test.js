const { getMainPage } = require('./dizibox.js');

async function test() {
  console.log("Ana sayfa çekiliyor...");
  const sonuc = await getMainPage('https://www.dizibox.live/');
  
  if (sonuc.isOk) {
    console.log("Başarılı! Toplam dizi:", sonuc.items.length);
    console.log("İlk dizi:", sonuc.items[0].name);
  } else {
    console.log("Hata:", sonuc.error);
  }
}

test();
