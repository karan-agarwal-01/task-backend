const { default: axios } = require("axios");
const { gridfsBucket } = require("../config/gridfs");

async function saveImageFromUrl(url) {
  try {
    const response = await axios.get(url, { responseType: "stream" });
    const filename = `photo_${Date.now()}`;

    return new Promise((resolve, reject) => {
      const uploadStream = gridfsBucket.openUploadStream(filename);

      response.data.pipe(uploadStream);

      uploadStream.on("finish", () => resolve(filename));
      uploadStream.on("error", reject);
    });

  } catch (err) {
    console.log("Image store error:", err);
    return null;
  }
}

module.exports = { saveImageFromUrl };
