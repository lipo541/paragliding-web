/**
 * Favicon Generator Script
 * ========================
 * აგენერირებს favicon-ებს Vercel-ის ლოგოდან
 * 
 * გაშვება: node scripts/generate-favicons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Vercel-ის ლოგო - შავი ფონით თეთრი სამკუთხედი
const vercelLogoSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#000000"/>
  <path d="M256 96L448 416H64L256 96Z" fill="#ffffff"/>
</svg>
`;

async function generateFavicons() {
  const publicDir = path.join(__dirname, '..', 'public');
  const appDir = path.join(__dirname, '..', 'app');

  console.log('🎨 Generating favicons from Vercel logo...\n');

  try {
    // 1. favicon.ico (32x32) - app directory-ში
    await sharp(Buffer.from(vercelLogoSvg))
      .resize(32, 32)
      .png()
      .toFile(path.join(appDir, 'favicon.ico'));
    console.log('✅ favicon.ico (32x32) - app/');

    // 2. icon.png (32x32) - app directory-ში
    await sharp(Buffer.from(vercelLogoSvg))
      .resize(32, 32)
      .png()
      .toFile(path.join(appDir, 'icon.png'));
    console.log('✅ icon.png (32x32) - app/');

    // 3. apple-icon.png (180x180) - app directory-ში
    await sharp(Buffer.from(vercelLogoSvg))
      .resize(180, 180)
      .png()
      .toFile(path.join(appDir, 'apple-icon.png'));
    console.log('✅ apple-icon.png (180x180) - app/');

    // 4. og-image.png (1200x630) - Open Graph image
    const ogSvg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#000000"/>
      <path d="M600 150L850 500H350L600 150Z" fill="#ffffff"/>
      <text x="600" y="580" font-family="Arial, sans-serif" font-size="40" fill="#ffffff" text-anchor="middle">Paragliding Georgia</text>
    </svg>
    `;
    await sharp(Buffer.from(ogSvg))
      .resize(1200, 630)
      .png()
      .toFile(path.join(publicDir, 'og-image.png'));
    console.log('✅ og-image.png (1200x630) - public/');

    // 5. logo.png (512x512) - JSON-LD-სთვის
    await sharp(Buffer.from(vercelLogoSvg))
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'logo.png'));
    console.log('✅ logo.png (512x512) - public/');

    console.log('\n🎉 All favicons generated successfully!');
    console.log('\n📝 Note: Deploy to Vercel and wait for Google to re-crawl.');

  } catch (error) {
    console.error('❌ Error generating favicons:', error);
    process.exit(1);
  }
}

generateFavicons();
