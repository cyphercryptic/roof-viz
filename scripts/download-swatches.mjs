#!/usr/bin/env node
/**
 * Download swatch images from manufacturer websites and upload to Supabase Storage.
 * Run: node scripts/download-swatches.mjs
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const SUPABASE_URL = 'https://gqqvxzxzuaevsuwazaqx.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxcXZ4enh6dWFldnN1d2F6YXF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY0NjMyOSwiZXhwIjoyMDkwMjIyMzI5fQ.UVeZKIPQZa0ho-pgMEO2pENEML-L1cCGozE-zIh72m0';
const BUCKET = 'product-swatches';

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Download an image, convert to JPEG, resize to target, and upload to Supabase.
 */
async function downloadAndUpload(sourceUrl, storagePath, targetSize = 600) {
  try {
    console.log(`  Fetching: ${sourceUrl}`);
    const res = await fetch(sourceUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': new URL(sourceUrl).origin + '/',
      },
    });

    if (!res.ok) {
      console.log(`  ❌ HTTP ${res.status} for ${storagePath}`);
      return false;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const metadata = await sharp(buffer).metadata();
    console.log(`  📐 Source: ${metadata.width}x${metadata.height} (${metadata.format})`);

    // Convert to JPEG and resize if larger than target
    let processed = sharp(buffer);
    if (metadata.width > targetSize || metadata.height > targetSize) {
      processed = processed.resize(targetSize, targetSize, { fit: 'cover' });
    }
    const jpegBuffer = await processed.jpeg({ quality: 90, mozjpeg: true }).toBuffer();

    // Upload to Supabase (upsert)
    const { error } = await sb.storage
      .from(BUCKET)
      .upload(storagePath, jpegBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.log(`  ❌ Upload error for ${storagePath}: ${error.message}`);
      return false;
    }

    console.log(`  ✅ Uploaded: ${storagePath} (${(jpegBuffer.length / 1024).toFixed(1)}KB)`);
    return true;
  } catch (err) {
    console.log(`  ❌ Error for ${storagePath}: ${err.message}`);
    return false;
  }
}

// ============================================================
// IMAGE SOURCES
// ============================================================

const IKO_DYNASTY = [
  { color: 'Glacier', url: 'https://www.iko.com/na/wp-content/uploads/2024/04/RGB-GLCR_IKO_CRC_PRFM_SWCH-upd-min.webp' },
  { color: 'Granite Black', url: 'https://www.iko.com/na/wp-content/uploads/2024/04/RGB-GRBK_IKO_CRC_PRFM_SWCH-upd-min.webp' },
  { color: 'Shadow Brown', url: 'https://www.iko.com/na/wp-content/uploads/2024/04/RGB-SHBN_IKO_CRC_PRFM_SWCH.webp' },
  { color: 'Biscayne', url: 'https://www.iko.com/na/wp-content/uploads/2024/05/RGB-BCYN_IKO_CRC_DYST_SWCH-upd-min.webp' },
  { color: 'Cornerstone', url: 'https://www.iko.com/na/wp-content/uploads/2024/05/RGB-CRNS_IKO_CRC_PRFM_SWCH-upd-min-1.webp' },
  { color: 'Frostone Grey', url: 'https://www.iko.com/na/wp-content/uploads/2024/05/FRGY_IKO_CRC_PRFM_SWCH-1.webp' },
  { color: 'Monaco Red', url: 'https://www.iko.com/na/wp-content/uploads/2024/05/RGB-MNRD_IKO_CRC_DYST_SWCH-upd-min.webp' },
  { color: 'Brownstone', url: 'https://www.iko.com/na/wp-content/uploads/2024/05/RGB-BSTN_IKO_CRC_PRFM_SWCH-upd-min-1.webp' },
  { color: 'Driftshake', url: 'https://www.iko.com/na/wp-content/uploads/2024/05/RGB-DRSK_IKO_CRC_PRFM_SWCH-upd-min-1.webp' },
  // Sedona, Castle Grey, Pacific Rim — not on current IKO site
];

const ATLAS_STORMMASTER = [
  { color: 'Pewter', url: 'https://www.atlasroofing.com/img/Pewter-STORMMASTER-SHAKE_2022-12-14-143349_jwhr.png' },
  { color: 'Weathered Wood', url: 'https://www.atlasroofing.com/img/Weathered-Wood-STORMMASTER-SHAKE.png' },
  { color: 'Charcoal', url: 'https://www.atlasroofing.com/img/Black-Shadow-STORMMASTER-SHAKE_2022-12-14-143413_cqwh.png' }, // Black Shadow ≈ Charcoal
  { color: 'Hearthstone', url: 'https://www.atlasroofing.com/img/Chestnut-STORMMASTER-SHAKE.png' }, // Chestnut ≈ Hearthstone
  { color: 'Driftwood', url: 'https://www.atlasroofing.com/img/Morning-Harvest-STORMMASTER-SHAKE.png' }, // Morning Harvest ≈ Driftwood
  { color: 'Coastal Granite', url: 'https://www.atlasroofing.com/img/Moonlight-Beach.png' }, // Moonlight Beach ≈ Coastal Granite
  { color: 'Pinnacle Gray', url: 'https://www.atlasroofing.com/img/Aspen-Grove.png' }, // Aspen Grove ≈ Pinnacle Gray
];

const TAMKO_HERITAGE = [
  { color: 'Oxford Grey', url: 'https://www.tamko.com/images/default-source/americas-shingle/swatches/heritage-series-oxford-grey-joplin-color-swatch.jpg?sfvrsn=10dc5ea0_3' },
  { color: 'Weathered Wood', url: 'https://www.tamko.com/images/default-source/americas-shingle/swatches/heritage-series-weathered-wood-phillipsburg-color-swatch.jpg?sfvrsn=4db55ea0_4' },
  { color: 'Rustic Redwood', url: 'https://www.tamko.com/images/default-source/americas-shingle/swatches/heritage-series-rustic-redwood-phillipsburg-color-swatch.jpg' },
  { color: 'Slate', url: 'https://www.tamko.com/images/default-source/americas-shingle/swatches/heritage-series-rustic-slate-phillipsburg-color-swatch.jpg' },
  { color: 'Black Walnut', url: 'https://www.tamko.com/images/default-source/americas-shingle/swatches/heritage-series-rustic-black-phillipsburg-color-swatch.jpg?sfvrsn=39b15ea0_4' },
  { color: 'Thunderstorm Grey', url: 'https://www.tamko.com/images/default-source/americas-shingle/swatches/heritage-series-shadow-grey-tuscaloosa-color-swatch.jpg?sfvrsn=9bdc5ea0_3' },
  { color: 'Natural Timber', url: 'https://www.tamko.com/images/default-source/americas-shingle/swatches/heritage-series-rustic-hickory-phillipsburg-color-swatch.jpg' },
  { color: 'Rustic Cedar', url: 'https://www.tamko.com/images/default-source/americas-shingle/swatches/heritage-series-antique-slate-joplin-color-swatch.jpg?sfvrsn=abdf5ea0_3' },
];

// ============================================================
// MAIN
// ============================================================

async function main() {
  let total = 0;
  let success = 0;

  console.log('\n🎨 === IKO Dynasty ===');
  for (const { color, url } of IKO_DYNASTY) {
    total++;
    const path = `iko/dynasty/${slugify(color)}.jpg`;
    if (await downloadAndUpload(url, path)) success++;
  }

  console.log('\n🎨 === Atlas StormMaster Shake ===');
  for (const { color, url } of ATLAS_STORMMASTER) {
    total++;
    const path = `atlas/stormmaster-shake/${slugify(color)}.jpg`;
    if (await downloadAndUpload(url, path)) success++;
  }

  console.log('\n🎨 === TAMKO Heritage (higher-res replacements) ===');
  for (const { color, url } of TAMKO_HERITAGE) {
    total++;
    const path = `tamko/heritage/${slugify(color)}.jpg`;
    if (await downloadAndUpload(url, path)) success++;
  }

  console.log(`\n✨ Done! ${success}/${total} images uploaded successfully.\n`);
}

main().catch(console.error);
