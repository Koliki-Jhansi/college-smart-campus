const QRCode = require('qrcode');

const generateQRCodeDataURL = async (text) => {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 280,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff'
      }
    });
    return dataUrl;
  } catch (err) {
    console.error('QR Generation Error:', err);
    return '';
  }
};

module.exports = {
  generateQRCodeDataURL,
};
