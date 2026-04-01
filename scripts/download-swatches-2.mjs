#!/usr/bin/env node
/**
 * Download swatch images batch 2: GAF designer lines + partial gaps from Roofle CDN.
 * Run: node scripts/download-swatches-2.mjs
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const SUPABASE_URL = 'https://gqqvxzxzuaevsuwazaqx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxcXZ4enh6dWFldnN1d2F6YXF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY0NjMyOSwiZXhwIjoyMDkwMjIyMzI5fQ.UVeZKIPQZa0ho-pgMEO2pENEML-L1cCGozE-zIh72m0';
const BUCKET = 'product-swatches';

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function downloadAndUpload(sourceUrl, storagePath, targetSize = 600) {
  try {
    console.log(`  Fetching: ${sourceUrl}`);
    const res = await fetch(sourceUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });

    if (!res.ok) {
      console.log(`  ❌ HTTP ${res.status} for ${storagePath}`);
      return false;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const metadata = await sharp(buffer).metadata();
    console.log(`  📐 Source: ${metadata.width}x${metadata.height} (${metadata.format})`);

    let processed = sharp(buffer);
    if (metadata.width > targetSize || metadata.height > targetSize) {
      processed = processed.resize(targetSize, targetSize, { fit: 'cover' });
    }
    const jpegBuffer = await processed.jpeg({ quality: 90, mozjpeg: true }).toBuffer();

    const { error } = await sb.storage
      .from(BUCKET)
      .upload(storagePath, jpegBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.log(`  ❌ Upload error: ${error.message}`);
      return false;
    }

    console.log(`  ✅ Uploaded: ${storagePath} (${(jpegBuffer.length / 1024).toFixed(1)}KB)`);
    return true;
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
    return false;
  }
}

// Roofle CDN URL builder
// Pattern: https://assets.roofle.com/{brand-code}/{line-code}/{color-slug}/gaf-{line-name}-{color-slug}-swatch.jpg
function roofleUrl(brandCode, lineCode, lineName, colorSlug) {
  return `https://assets.roofle.com/${brandCode}/${lineCode}/${colorSlug}/${brandCode === 'gaf' ? 'gaf' : brandCode}-${lineName}-${colorSlug}-swatch.jpg`;
}

// ============================================================
// GAF Camelot II (from Roofle)
// ============================================================
const GAF_CAMELOT_II = [
  { color: 'Charcoal', slug: 'charcoal' },
  { color: 'Pewter Gray', slug: 'pewtergray' },
  { color: 'Weathered Wood', slug: 'weatheredwood' },
  { color: 'Antique Slate', slug: 'antiqueslate' },
  { color: 'Barkwood', slug: 'barkwood' },
  { color: 'Williamsburg Slate', slug: 'williamsburgslate' },
  { color: 'Royal Slate', slug: 'royalslate' },
];

// ============================================================
// GAF Grand Sequoia (from Roofle)
// ============================================================
const GAF_GRAND_SEQUOIA = [
  { color: 'Charcoal', slug: 'charcoal' },
  { color: 'Pewter Gray', slug: 'pewtergray' },
  { color: 'Weathered Wood', slug: 'weatheredwood' },
  { color: 'Mesa Brown', slug: 'mesabrown' },
  { color: 'Autumn Brown', slug: 'autumnbrown' },
  { color: 'Slate', slug: 'slate' },
  { color: 'Cedar', slug: 'cedar' },
];

// ============================================================
// GAF Royal Sovereign (from Roofle)
// ============================================================
const GAF_ROYAL_SOVEREIGN = [
  { color: 'Charcoal', slug: 'charcoal' },
  { color: 'Pewter Gray', slug: 'pewtergray' },
  { color: 'Weathered Gray', slug: 'weatheredgray' },
  { color: 'Autumn Brown', slug: 'autumnbrown' },
  { color: 'Golden Cedar', slug: 'goldencedar' },
  { color: 'Slate', slug: 'slate' },
  { color: 'White', slug: 'white' },
  { color: 'Silver Lining', slug: 'silverlining' },
];

// ============================================================
// GAF Timberline HDZ partial gaps (from Roofle)
// ============================================================
const GAF_HDZ_GAPS = [
  { color: 'Golden Harvest', slug: 'goldenharvest' },
  { color: 'Appalachian Sky', slug: 'appalachiansky' },
  { color: 'Midnight Mesa', slug: 'midnightmesa' },
  { color: 'Biscayne Blue', slug: 'biscayneblue' },
];

// ============================================================
// GAF HDZ RS partial gaps
// ============================================================
const GAF_HDZ_RS_GAPS = [
  { color: 'White', slug: 'white' },
];

// ============================================================
// GAF UHDZ partial gaps
// ============================================================
const GAF_UHDZ_GAPS = [
  { color: 'Hickory', slug: 'hickory' },
  { color: 'Dual Charcoal', slug: 'dualcharcoal' },
  { color: 'Dual Pewter Gray', slug: 'dualpewterblend' },
  { color: 'Dual Weathered Wood', slug: 'dualweatheredwood' },
  { color: 'Dual Hickory', slug: 'dualhickory' },
];

// ============================================================
// OC Duration partial gaps (from Roofle)
// ============================================================
const OC_DURATION_GAPS = [
  { color: 'Desert Tan', slug: 'deserttan' },
  { color: 'Quarry Gray', slug: 'quarrygray' },
  { color: 'Flagstone', slug: 'flagstone' },
  { color: 'Shasta White', slug: 'shastawhite' },
];

const OC_DURATION_STORM_GAPS = [
  { color: 'Quarry Gray', slug: 'quarrygray' },
  { color: 'Desert Tan', slug: 'deserttan' },
];

const OC_OAKRIDGE_GAPS = [
  { color: 'Desert Tan', slug: 'deserttan' },
  { color: 'Amber', slug: 'amber' },
];

// ============================================================
// CertainTeed partial gaps (from Roofle)
// ============================================================
const CT_LANDMARK_GAPS = [
  { color: 'Sunrise Cedar', slug: 'sunrisecedar' },
  { color: 'Charcoal Black', slug: 'charcoalblack' },
  { color: 'Cinder', slug: 'cinder' },
];

const CT_PRESIDENTIAL_GAPS = [
  { color: 'Charcoal Black', slug: 'charcoalblack' },
  { color: 'Shadow Gray', slug: 'shadowgray' },
  { color: 'Autumn Blend', slug: 'autumnblend' },
  { color: 'Country Gray', slug: 'countrygraybristol' },
];

// ============================================================
// MAIN
// ============================================================

async function processBatch(label, items, brandCode, lineCode, lineName, storageBrand, storageLine) {
  console.log(`\n🎨 === ${label} ===`);
  let success = 0;
  for (const { color, slug } of items) {
    const url = roofleUrl(brandCode, lineCode, lineName, slug);
    const path = `${storageBrand}/${storageLine}/${slugify(color)}.jpg`;
    if (await downloadAndUpload(url, path)) success++;
  }
  return { total: items.length, success };
}

async function main() {
  let totalAll = 0;
  let successAll = 0;

  // Also try the welteroofing.com image for Camelot II Charcoal as backup
  const batches = [
    // GAF Camelot II
    processBatch('GAF Camelot II', GAF_CAMELOT_II, 'gaf', 'c2', 'camelot-ii', 'gaf', 'camelot-ii'),
    // GAF Grand Sequoia
    processBatch('GAF Grand Sequoia', GAF_GRAND_SEQUOIA, 'gaf', 'gs', 'grand-sequoia', 'gaf', 'grand-sequoia'),
    // GAF Royal Sovereign
    processBatch('GAF Royal Sovereign', GAF_ROYAL_SOVEREIGN, 'gaf', 'rs', 'royal-sovereign', 'gaf', 'royal-sovereign'),
  ];

  // Run the first 3 sequentially for cleaner output
  for (const batch of batches) {
    const { total, success } = await batch;
    totalAll += total;
    successAll += success;
  }

  // GAF HDZ gaps
  {
    console.log('\n🎨 === GAF Timberline HDZ (gaps) ===');
    for (const { color, slug } of GAF_HDZ_GAPS) {
      totalAll++;
      const url = roofleUrl('gaf', 'thdz', 'timberline-hdz', slug);
      if (await downloadAndUpload(url, `gaf/timberline-hdz/${slugify(color)}.jpg`)) successAll++;
    }
  }

  // GAF HDZ RS gaps
  {
    console.log('\n🎨 === GAF Timberline HDZ RS (gaps) ===');
    for (const { color, slug } of GAF_HDZ_RS_GAPS) {
      totalAll++;
      const url = roofleUrl('gaf', 'thdzrs', 'timberline-hdz-rs', slug);
      if (await downloadAndUpload(url, `gaf/timberline-hdz-rs/${slugify(color)}.jpg`)) successAll++;
    }
  }

  // GAF UHDZ gaps
  {
    console.log('\n🎨 === GAF Timberline UHDZ (gaps) ===');
    for (const { color, slug } of GAF_UHDZ_GAPS) {
      totalAll++;
      const url = roofleUrl('gaf', 'tuhdz', 'timberline-uhdz', slug);
      if (await downloadAndUpload(url, `gaf/timberline-uhdz/${slugify(color)}.jpg`)) successAll++;
    }
  }

  // OC Duration gaps
  {
    console.log('\n🎨 === OC Duration (gaps) ===');
    for (const { color, slug } of OC_DURATION_GAPS) {
      totalAll++;
      const url = `https://assets.roofle.com/oco/d/${slug}/owens-corning-duration-${slug}-swatch.jpg`;
      if (await downloadAndUpload(url, `owens-corning/duration/${slugify(color)}.jpg`)) successAll++;
    }
  }

  {
    console.log('\n🎨 === OC Duration STORM (gaps) ===');
    for (const { color, slug } of OC_DURATION_STORM_GAPS) {
      totalAll++;
      const url = `https://assets.roofle.com/oco/ds/${slug}/owens-corning-duration-storm-${slug}-swatch.jpg`;
      if (await downloadAndUpload(url, `owens-corning/duration-storm/${slugify(color)}.jpg`)) successAll++;
    }
  }

  {
    console.log('\n🎨 === OC Oakridge (gaps) ===');
    for (const { color, slug } of OC_OAKRIDGE_GAPS) {
      totalAll++;
      const url = `https://assets.roofle.com/oco/o/${slug}/owens-corning-oakridge-${slug}-swatch.jpg`;
      if (await downloadAndUpload(url, `owens-corning/oakridge/${slugify(color)}.jpg`)) successAll++;
    }
  }

  // CertainTeed gaps
  {
    console.log('\n🎨 === CertainTeed Landmark (gaps) ===');
    for (const { color, slug } of CT_LANDMARK_GAPS) {
      totalAll++;
      const url = `https://assets.roofle.com/cer/l/${slug}/certainteed-landmark-${slug}-swatch.jpg`;
      if (await downloadAndUpload(url, `certainteed/landmark/${slugify(color)}.jpg`)) successAll++;
    }
  }

  {
    console.log('\n🎨 === CertainTeed Presidential Shake (gaps) ===');
    for (const { color, slug } of CT_PRESIDENTIAL_GAPS) {
      totalAll++;
      const url = `https://assets.roofle.com/cer/ps/${slug}/certainteed-presidential-shake-${slug}-swatch.jpg`;
      if (await downloadAndUpload(url, `certainteed/presidential-shake/${slugify(color)}.jpg`)) successAll++;
    }
  }

  console.log(`\n✨ Done! ${successAll}/${totalAll} images uploaded successfully.\n`);
}

main().catch(console.error);
