// This file is used to scrape data from the website and store it in the database

const axios = require("axios");
const fs = require("fs");
const mongoose = require("mongoose");

const ExerciseModel = require("./models/exerciseModel");
const Jimp = require("jimp");

require("dotenv").config();

const axiosInstance = axios.create({
  baseURL: "http://127.0.0.1:4500/exercises/",
});

const getExercisesData = async function () {
  try {
    const totalPages = 500;
    const muscleTypes = [
      "chest",
      "forearms",
      "lats",
      "middle-back",
      "lower-back",
      "neck",
      "quadriceps",
      "hamstrings",
      "calves",
      "triceps",
      "traps",
      "shoulders",
      "abdominals",
      "glutes",
      "biceps",
      "adductors",
      "abductors",
    ];

    const loopPages = async function (muscleType) {
      for (let i = 1; i <= totalPages; i++) {
        try {
          console.log(`Getting exercises from ${muscleType} page ${i}`);

          const exerciseList = [];

          const { status, data } = await axiosInstance.get(`/finder/${i}`, {
            params: {
              muscle: muscleType,
            },
          });

          if (data.results.length === 0) {
            console.log(
              `No more exercises found: page ${i} type ${muscleType}`
            );
            break;
          }

          if (Array.isArray(data.results)) {
            data.results.forEach((el) => {
              if (!exerciseList.includes(el)) {
                exerciseList.push({...el, muscle: muscleType});
              } else {
                console.log("Duplicate found: ", el.name, i);
              }
            });
          }

          // console.log(exerciseList);

          const response = await ExerciseModel.insertMany(exerciseList);
          // console.log(response);
        } catch (err) {
          console.log(err.message);
        }
      }
    };

    muscleTypes.forEach(async (muscleType, index) => {
      if (index == 1) {
        await loopPages(muscleType);
      }
    });
  } catch (err) {
    console.log(err);
  }
};


const getExeciseInfo = async function () {
  try {
    let startIndex = 0;

    const results = await ExerciseModel.find({ slug: { $regex: /^\w/g }, muscle: "forearms" }).sort({
      slug: 1,
    });

    const download_image = async (imgUrl, filename) => {
      try {
        // Check if file exists
        const fileExists = fs.existsSync(filename)
        const quality = 90

        if(fileExists) {
          console.log(`File ${filename} already exists`)
          return true
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
        console.log(`Error: ${filename} ${err}`)

        return false;
      }
    };

    console.log(`Got ${results.length} exercises`)

    for (let i = 0; i < results.length; i++) {
      try {
        const { name, slug } = results[i];
        const { data } = await axiosInstance.get(`/info/`, {
          params: { slug },
        });

        const imageUrls = []

        fs.readdirSync("./static/images").forEach((file) => {
          if (file.includes(slug)) {
            imageUrls.push(file)
          }
        })

        const { details, benefits, description, instruction, images } = data;

        const updateObj = { details, benefits, description, instruction, 
          images: imageUrls.length ? imageUrls : undefined };

        Object.keys(updateObj).forEach((key) => {
          if (updateObj[key] === undefined) {
            delete updateObj[key];
          }
        });

        // console.log(`${i + 1}) ${slug}`, updateObj);

        // if (!imageUrls.length) {
        //   images.forEach(async (imgUrl, index) => {
        //     let filename = `./static/images/${slug}-${index + 1}.jpg`;

        //     let result = await download_image(imgUrl, filename);
        //     if (!result) {
        //       console.log(`Trying again: ${filename}`)
        //       await download_image(imgUrl, filename);
        //     }
        //   });
        // } else console.log(`No images found for ${slug}`);


        const result = await ExerciseModel.updateOne({slug}, {
          $set: {
            ...updateObj
          }
        })

        console.log(`${i + 1}) ${slug}`, result)
      } catch (err) {
        console.log(err.message);
      }
    }

    console.log("Done getting exercise info");
  } catch (err) {
    console.log(err.message);
  }
};

const queryDataBase = async function () {
  try {
    const results = await ExerciseModel.find({ slug: { $regex: "^c" } }).sort({
      slug: 1,
    });
    console.log(results);
  } catch (err) {
    console.log(err.message);
  }
};

mongoose
  .connect(process.env.DATABASE_URI)
  .then(() => {
    console.log("Connected to database");
    // getExeciseInfo();
    queryDataBase();
    // getExercisesData();
  })
  .catch((err) => console.log(err.message));
