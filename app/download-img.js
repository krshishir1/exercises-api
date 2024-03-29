const ExerciseModel = require("./models/exerciseModel");
const mongoose = require("mongoose");
require("dotenv").config();

const axios = require("axios");
const Jimp = require("jimp");
const fs = require("fs");
const yargs = require("yargs");

const axiosInstance = axios.create({
  baseURL: `${process.env.WEBSITE_URL}/exercises/`,
});

const download = async function (inputMuscleType, startIndex) {
  try {
    const results = await ExerciseModel.find({
      slug: { $regex: /^\w/g },
      muscle: inputMuscleType,
    }).sort({
      slug: 1,
    });

    const download_image = async (imgUrl, filename) => {
      try {
        // Check if file exists
        const fileExists = fs.existsSync(filename);
        const quality = 90;

        if (fileExists) {
          console.log(`File ${filename} already exists`);
          return true;
        }

        const image = await Jimp.read(imgUrl);

        let width = image.bitmap.width;
        let height = image.bitmap.height;

        const ratio = width / height;

        if (ratio >= 1) {
          await image.resize(600, Jimp.AUTO).quality(quality).write(filename);
        } else {
          await image.resize(Jimp.AUTO, 600).quality(quality).write(filename);
        }

        console.log(`Image ${filename} downloaded`);

        return true;
      } catch (err) {
        console.log(`Error: ${filename} ${err}`);

        return false;
      }
    };

    console.log(`Got ${results.length} exercises`);

    for (let i = startIndex; i < results.length; i++) {
      const { slug } = results[i];

      try {
        const { data } = await axiosInstance.get(`/info/`, {
          params: { slug },
        });

        const { images } = data;

        // console.log(`${i + 1}) ${slug}`, updateObj);

        if (Array.isArray(images)) {
          images.forEach(async (imgUrl, index) => {
            let filename = `./static/images/${slug}-${index + 1}.jpg`;

            let result = await download_image(imgUrl, filename);
            if (!result) {
              console.log(`Trying again: ${filename}`);
              await download_image(imgUrl, filename);
            }
          });
        } else console.log(`No images found for ${slug}`);
      } catch (err) {
        console.log(`${err.message} for ${slug}`);
      }
    }

    console.log("Done getting exercise info");
  } catch (err) {
    console.log(err.message);
  }
};

mongoose
  .connect(process.env.DATABASE_URI)
  .then(() => {
    console.log("Connected to database");

    const muscleType = yargs.argv.muscle;
    const startIndex = yargs.argv.start || 0;

    console.log(muscleType, startIndex);

    if(muscleType) {
        download(muscleType, Number(startIndex));
    }
  })
  .catch((err) => console.log(err.message));
