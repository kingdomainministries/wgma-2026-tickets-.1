const Jimp = require('jimp');
const QRCode = require('qrcode');
const path = require('path');

async function buildTicket(order, outputPath) {
  try {
    // Load ticket background
    const ticketImagePath = path.join(__dirname, 'public', order.image);
    const ticketImage = await Jimp.read(ticketImagePath);

    // Generate QR code
    const qrDataUrl = await QRCode.toDataURL(order.orderId, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 300
    });

    // Convert data URL to buffer
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
    const qrImage = await Jimp.read(qrBuffer);

    // Resize QR code to fit ticket
    qrImage.resize(200, 200);

    // Composite QR code onto ticket (bottom right corner)
    ticketImage.composite(qrImage, ticketImage.getWidth() - 220, ticketImage.getHeight() - 220);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    const fs = require('fs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save ticket
    await ticketImage.write(outputPath);
    console.log(`Ticket generated: ${outputPath}`);
  } catch (error) {
    console.error('Ticket generation error:', error.message);
    throw error;
  }
}

module.exports = { buildTicket };
