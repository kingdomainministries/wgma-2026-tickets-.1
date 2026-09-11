const Jimp = require('jimp');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

/**
 * Builds a ticket image with QR code and returns it as a JPEG buffer.
 * @param {Object} order - Order details { reference, name, tier, quantity, total, currency, email, ... }
 * @param {Object} tier - Tier details { id, name, price, art }
 * @param {Object} event - Event details { name, date, time, venue }
 * @returns {Promise<Buffer>} JPEG image buffer
 */
async function buildTicket(order, tier, event) {
  // Validate inputs
  if (!order || !tier || !event) {
    throw new Error('buildTicket requires order, tier, and event objects');
  }

  if (!order.reference) {
    throw new Error('Order missing reference code');
  }

  if (!tier.art) {
    throw new Error(`Tier "${tier.id}" missing artwork file (art property)`);
  }

  try {
    // Load ticket artwork
    const artPath = path.join(__dirname, 'public', 'img', tier.art);

    // Verify artwork exists
    if (!fs.existsSync(artPath)) {
      throw new Error(`Artwork not found: ${artPath}`);
    }

    const ticketImage = await Jimp.read(artPath);
    console.log(`Loaded artwork: ${tier.art} (${ticketImage.getWidth()}x${ticketImage.getHeight()})`);

    // Generate QR code as PNG buffer
    const qrBuffer = await QRCode.toBuffer(order.reference, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 300
    });

    const qrImage = await Jimp.read(qrBuffer);

    // Resize QR code to fit on ticket (typically 200x200)
    qrImage.resize(200, 200);

    // Composite QR code onto ticket (bottom right area, with padding)
    const ticketWidth = ticketImage.getWidth();
    const ticketHeight = ticketImage.getHeight();
    const qrSize = 200;
    const padding = 20;

    const qrX = ticketWidth - qrSize - padding;
    const qrY = ticketHeight - qrSize - padding;

    ticketImage.composite(qrImage, qrX, qrY);
    console.log(`Composited QR code at (${qrX}, ${qrY})`);

    // Convert to JPEG buffer and return
    // Use a Promise wrapper for the callback-based API in Jimp 0.22
    const jpegBuffer = await new Promise((resolve, reject) => {
      ticketImage
        .quality(90)
        .getBuffer('image/jpeg', (err, buffer) => {
          if (err) reject(err);
          else resolve(buffer);
        });
    });

    console.log(`Ticket generated successfully for ${order.reference}: ${jpegBuffer.length} bytes`);

    return jpegBuffer;
  } catch (error) {
    console.error('Ticket generation error:', error.message);
    throw error;
  }
}

module.exports = { buildTicket };
