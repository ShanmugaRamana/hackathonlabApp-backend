// config/imagekit.js
const ImageKit = require('imagekit');
require('dotenv').config();

let imagekit;

try {
  imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });

  if (imagekit) {
    console.log("✅ ImageKit initialized successfully");
  }
} catch (error) {
  console.error("❌ Failed to initialize ImageKit:", error.message);
}

module.exports = imagekit;