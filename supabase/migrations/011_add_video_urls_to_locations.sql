-- Add video_urls support to location_pages content structure
-- This migration adds documentation for shared_videos and shared_flight_types in the JSONB structure

COMMENT ON COLUMN location_pages.content IS 'Multilingual content with shared_videos, shared_flight_types, shared_images + ka/en/ru/ar/de/tr languages';

-- ============================================
-- Updated JSONB Content Structure Documentation
-- ============================================

/*
location_pages.content JSONB structure (UPDATED):

{
  "shared_videos": [
    "https://www.youtube.com/watch?v=VIDEO_ID_1",
    "https://youtu.be/VIDEO_ID_2"
  ],
  "shared_flight_types": [
    {
      "id": "tandem-basic-1732123456-abc123",
      "price_gel": 150,
      "price_usd": 50,
      "price_eur": 45
    },
    {
      "id": "acro-advanced-1732123789-def456",
      "price_gel": 200,
      "price_usd": 70,
      "price_eur": 65
    }
  ],
  "shared_images": {
    "hero_image": {
      "url": "https://.../locations/gudauri/hero.jpg",
      "alt_ka": "გუდაურის პარაპლანერიზმი",
      "alt_en": "Paragliding in Gudauri",
      "alt_ru": "Парапланеризм в Гудаури"
    },
    "gallery": [...]
  },
  "ka": {
    "h1_tag": "პარაპლანერიზმი გუდაურში",
    "p_tag": "საუკეთესო პარაპლანერიზმის ადგილი საქართველოში",
    "h2_history": "გუდაურის ისტორია",
    "history_text": "<p>Rich text HTML content...</p>",
    "gallery_description": "გუდაურის პარაპლანერიზმის გალერეა",
    "h3_flight_types": "ფრენის ტიპები გუდაურში",
    "flight_types": [
      {
        "shared_id": "tandem-basic-1732123456-abc123",
        "name": "ტანდემ ფრენა",
        "description": "დამწყებთათვის იდეალური ფრენა ინსტრუქტორთან ერთად",
        "features": ["უსაფრთხო", "ინსტრუქტორი", "ვიდეო გადაღება"]
      },
      {
        "shared_id": "acro-advanced-1732123789-def456",
        "name": "აკრობატიკა",
        "description": "გამოცდილი პილოტებისთვის",
        "features": ["ექსტრემალური", "მაღალი უნარები"]
      }
    ]
  },
  "en": {
    "h1_tag": "Paragliding in Gudauri",
    "p_tag": "Best paragliding location in Georgia",
    "h2_history": "History of Gudauri",
    "history_text": "<p>Rich text HTML content...</p>",
    "gallery_description": "Gudauri Paragliding Gallery",
    "h3_flight_types": "Flight Types in Gudauri",
    "flight_types": [
      {
        "shared_id": "tandem-basic-1732123456-abc123",
        "name": "Tandem Flight",
        "description": "Ideal for beginners with instructor",
        "features": ["Safe", "Instructor", "Video recording"]
      },
      {
        "shared_id": "acro-advanced-1732123789-def456",
        "name": "Acrobatics",
        "description": "For experienced pilots",
        "features": ["Extreme", "High skills"]
      }
    ]
  },
  "ru": { ...same structure... },
  "ar": { ...same structure... },
  "de": { ...same structure... },
  "tr": { ...same structure... }
}

Key Points:
- shared_videos: YouTube URL-ების მასივი (საერთო ყველა ენისთვის)
- shared_flight_types: ფრენის ტიპები ID + ფასებით (საერთო ყველა ენისთვის)
  * id: უნიკალური იდენტიფიკატორი
  * price_gel, price_usd, price_eur: ფასები ლარში, დოლარში, ევროში
- shared_images: სურათები საერთო ყველა ენისთვის, მხოლოდ ALT თარგმნილია
- Languages (ka/en/ru/ar/de/tr): 
  * flight_types: მხოლოდ თარგმნილი ველები (shared_id ლინკით)
  * name, description, features: ენა-სპეციფიკური ტექსტები

How Flight Types Work:
1. ქართულში იქმნება flight type + ფასები → shared_flight_types-ში ინახება
2. სხვა ენებში ვითარგმნით მხოლოდ name, description, features
3. ფასები ყველა ენაზე იგივეა - იღება shared_flight_types-იდან shared_id-ით
4. ფასის ცვლილება ერთ ადგილას ხდება - shared_flight_types-ში
5. დაჯავშნისას shared_id-ით ვაბამთ ზუსტ ფასებს
*/

