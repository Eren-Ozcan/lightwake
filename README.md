# Lightwake

> Ekranı neredeyse tamamen karanlık bırakan bir yankı-konum (echolocation)
> bulmaca oyunu. Ekrana dokun → tık sesi → stereo yankı + titreşim geri
> döner. Sürükleyerek ilerle, zihninde bir harita kur. Bölüm sonunda
> karanlıkta yürüdüğün yolun parlayan silüetini gör.

Orijinal fikir: [`game-ideas` reposundaki `18-yanki.tr.md`](https://github.com/Eren-Ozcan/game-ideas/blob/master/ideas/18-yanki.tr.md).

## Yapılanlar — Faz 0 (his prototipi, tamamlandı)

- **Stack:** Vite + TypeScript, PWA, sıfır çalışma zamanı bağımlılığı — sadece
  Web Audio API, Vibration API, Pointer Events.
- **Çekirdek mekanik:** dokunma → tık + yankı. Beş ışın, oyuncunun sadece ön
  180°'sine atılıyor — arkaya hiç ışın atılmıyor, çünkü stereo panlama tek
  başına ön/arka ayıramaz; arkaya atmak bilgi değil gürültü üretirdi.
- **Hareket:** sürükleyerek ileri/geri + 90°'lik sağa/sola dönüş. Serbest
  rotasyon yok — dönüş sonrası yön kaybını önlemek için bilinçli tercih.
- **Ses tasarımı:** örneksiz, tamamen prosedürel tık/yankı sentezi;
  paylaşımlı bir konvolüsyon reverb (panlamadan önce alınıyor, yön bilgisini
  bulanıklaştırmadan mekân hissi katıyor); tık başına ±%7 perde varyasyonu;
  checkpoint/tamamlama akorları; duvara çarpma için ayrı, haptiğe bağımlı
  olmayan bir "bam" sesi.
- **Haptik:** bilgi kanalı değil doku kanalı (Vibration API sadece süre
  kontrol edebiliyor, genlik değil). iOS Safari'de sessizce devre dışı kalıyor.
- **60 bölüm:** 3'ü elle tasarlanmış (Kısa/Orta/Uzun), 57'si deterministik
  olarak üretilmiş (sabit seed, her oynayışta aynı). Zorluk 5 ile 22 dönüş
  arasında kademeli artıyor.
- **Doğrulama:** `npm run verify-levels` — her bölümün tek bağlantılı yol
  olduğunu (dallanma/bitişik koridor yok), checkpoint ve bitişin
  başlangıçtan erişilebilir olduğunu kontrol ediyor. Bu betik, elle
  tasarlanan orijinal "Uzun" bölümde gerçek bir T-kavşağı hatası yakaladı.
- **Fiziksel test:** kullanıcı iPhone'da ilk birkaç bölümü oynadı — Faz 0'ın
  asıl riski olan "dönüşten sonra yön kaybı" doğrulandı, çalışıyor.

## Bilinen sınırlar

- iPhone/Safari'de titreşim çalışmıyor — Apple'ın platform kısıtı, web'den
  düzeltilemez.
- 57 üretilmiş bölüm sadece yapısal olarak doğrulandı (kod seviyesinde);
  fiziksel/his testi yapılmadı.
- Tek ses paleti var, biyom çeşitliliği henüz yok.
- Kulaklık takılı olup olmadığını algılayan bir web API'si yok — sadece
  metinle uyarılabiliyor, gerçek algılama değil.

## Yapılacaklar

### Faz 1 — İçerik genişletmesi
- [ ] Gerçek biyom ses paletleri (buz mağarası, su altı, tapınak) — her biri
      yeni bir "duyma" becerisi öğretmeli
- [ ] Rütbe sistemi (ör. "Sessizlik Ustası", "Hız Koşucusu")
- [ ] Yaratık günlüğü

### Faz 2 — Cila
- [ ] Üretilmiş 57 bölümün fiziksel/his testi (şu an sadece yapısal doğrulanmış)
- [ ] Gerçek erişilebilirlik testi — görme engelli oyuncularla
- [ ] Kulaklık uyarısı metninin netleştirilmesi (algılama değil, hatırlatma)

### Faz 3 — Lansman hazırlığı
- [ ] ASMR/duyusal içerik üreticilerine erken erişim
- [ ] Apple erişilebilirlik vitrini başvurusu

### Platform kararı (beklemede)
- [ ] Gerçek native haptik için Flutter'a geçiş — Faz 0'da doğrulanan
      mekaniği iOS Core Haptics / Android VibrationEffect ile native'e taşımak

## Geliştirme

```
npm install
npm run dev:host   # telefonda aynı Wi-Fi üzerinden test için
npm run verify-levels
npm run build
```
