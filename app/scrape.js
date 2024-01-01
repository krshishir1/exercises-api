// This file is used to scrape data from the website and store it in the database

const axios = require("axios");
const fs = require("fs");
const mongoose = require("mongoose");
const yargs = require("yargs");

const ExerciseModel = require("./models/exerciseModel");

require("dotenv").config();

const axiosInstance = axios.create({
  baseURL: "http://localhost:4500/exercises/",
});

const setExercisesData = async function (inputMuscleType) {
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
          console.log(response);
        } catch (err) {
          console.log(err.message);
        }
      }
    };

    muscleTypes.forEach(async (muscleType) => {
      if (muscleType === inputMuscleType) {
        await loopPages(muscleType);
      }
    });
  } catch (err) {
    console.log(err);
  }
};


const setExerciseInfo = async function (inputMuscleType) {
  try {
    let startIndex = 0;

    const results = await ExerciseModel.find({ slug: { $regex: /^\w/g }, muscle: inputMuscleType }).sort({
      slug: 1,
    });

    console.log(`Got ${results.length} exercises`)

    for (let i = 0; i < results.length; i++) {
      try {
        const { slug } = results[i];
        const { data } = await axiosInstance.get(`/info/`, {
          params: { slug },
        });

        const imageUrls = []

        fs.readdirSync("./static/images").forEach((file) => {
          const newSlug = file.replace(/.jpg/g, "").replace(/-\d$/g, "")
          if (newSlug === slug) {
            imageUrls.push(file)
          }
        })

        const { details, benefits, description, instruction } = data;

        const updateObj = { details, benefits, description, instruction, 
          images: imageUrls.length ? imageUrls : undefined };

        Object.keys(updateObj).forEach((key) => {
          if (updateObj[key] === undefined) {
            delete updateObj[key];
          }
        });


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

    const muscleType = yargs.argv.muscle;
    if(muscleType) {
      setExercisesData(muscleType);
      // setExerciseInfo(muscleType);
    }
    
    // setExerciseInfo("chest");
  })
  .catch((err) => console.log(err.message));
