#!/usr/bin/env node
/**
 * Generate ticket artwork images for GA and VIP tiers.
 * These are the base images that will be composited with QR codes.
 */

const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, 'public', 'img');

async function generateTicketArt() {
  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const gaFont = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
  const smallFont = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);

  // Create GA ticket (General Admission)
  console.log('Generating GA ticket artwork...');
  const gaTicket = await Jimp.create(500, 600, 0x1a1a2eff);

  gaTicket
    .print(gaFont, 50, 80, 'GENERAL ADMISSION')
    .print(gaFont, 50, 150, 'WGMA 2026')
    .print(smallFont, 50, 220, 'November 22, 2026')
    .print(smallFont, 50, 250, '1:00 PM')
    .print(smallFont, 50, 280, 'West Jamaica Conference Centre')
    .print(gaFont, 50, 340, 'Price: $20 USD')
    .print(smallFont, 50, 400, 'or 3000 JMD')
    .print(smallFont, 50, 450, '✓ Access to main venue')
    .print(smallFont, 50, 480, '✓ Standard seating')
    .print(smallFont, 50, 510, '')
    .print(smallFont, 50, 540, 'Scan QR code at entrance');

  const gaBuffer = await gaTicket.quality(90).toBuffer();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'ticket-ga.jpg'), gaBuffer);
  console.log('✓ Generated: ticket-ga.jpg');

  // Create VIP ticket
  console.log('Generating VIP ticket artwork...');
  const vipTicket = await Jimp.create(500, 600, 0x16213eff);

  vipTicket
    .print(gaFont, 100, 80, 'VIP ADMISSION')
    .print(gaFont, 50, 150, 'WGMA 2026')
    .print(smallFont, 50, 220, 'November 22, 2026')
    .print(smallFont, 50, 250, '1:00 PM')
    .print(smallFont, 50, 280, 'West Jamaica Conference Centre')
    .print(gaFont, 50, 340, 'Price: $40 USD')
    .print(smallFont, 50, 400, 'or 6000 JMD')
    .print(smallFont, 50, 450, '⭐ VIP seating')
    .print(smallFont, 50, 480, '⭐ Meet & greet included')
    .print(smallFont, 50, 510, '')
    .print(smallFont, 50, 540, 'Scan QR code at entrance');

  const vipBuffer = await vipTicket.quality(90).toBuffer();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'ticket-vip.jpg'), vipBuffer);
  console.log('✓ Generated: ticket-vip.jpg');

  console.log('\nTicket artwork generated successfully!');
  console.log(`Output directory: ${OUTPUT_DIR}`);
  process.exit(0);
}

generateTicketArt().catch(err => {
  console.error('Error generating artwork:', err);
  process.exit(1);
});
