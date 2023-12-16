const axios = require("axios");
const fs = require("fs");
const { stringify } = require("csv-stringify");
const { parse } = require("csv-parse");

const fileName = "data/exercises-list.csv";

const axiosInstance = axios.create({
  baseURL: "http://127.0.0.1:4500/exercises/",
});

// const getData  =

const getExercisesData = async function () {
  try {
    const writableStream = fs.createWriteStream(fileName);
    const columns = ["name", "slug"];
    const stringifier = stringify({ header: true, columns });

    stringifier.pipe(writableStream);

    const totalPages = 500;

    const exerciseList = [];

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
        console.log(`Getting exercises from ${muscleType} page ${i}`);

        const { status, data } = await axiosInstance.get(`/finder/${i}`, {
          params: {
            muscle: muscleType,
          },
        });

        if (data.results.length === 0) {
          console.log(`No more exercises found: page ${i} type ${muscleType}`);
          break;
        }

        if (Array.isArray(data.results)) {
          data.results.forEach((el) => {
            if (!exerciseList.includes(el)) {
              exerciseList.push(el);
              stringifier.write(el);
            } else {
              console.log("Duplicate found: ", el.name, i);
            }
          });
        }
      }
    };

    muscleTypes.forEach((muscleType) => loopPages(muscleType));
  } catch (err) {
    console.log(err);
  }
};

const readExercisesData = async function () {
  try {
    const filename = "data/exercises1.csv";
    const exercises = [];
    fs.createReadStream(filename)
      .pipe(parse({ delimiter: ",", from_line: 2 }))
      .on("data", (row) => {
        if (exercises.indexOf(row) === -1) {
          exercises.push(row);
        } else console.log("Duplicate found: ", row);
      })
      .on("end", () => {
        console.log("Done reading file");
        // console.log(`Number of exercises found: ${exercises.length}`)

        getExeciseInfo(exercises);
      });
  } catch (err) {
    console.log(err.message);
  }
};

const getExeciseInfo = async function (exercises) {
  try {
    const filename = "data/exercises-list.csv"
    const writableStream = fs.createWriteStream(filename);
    const columns = ["name", "slug", "type", "muscle", "equipment", "level"];
    const stringifier = stringify({ header: true, columns });

    stringifier.pipe(writableStream);

    let startIndex = 0;
    let endIndex = exercises.length;
    

    for (let i = startIndex; i < endIndex; i++) {
      try {
        let name = exercises[i][0];
        let slug = exercises[i][1];

        const {data} = await axiosInstance.get("/info", {
          params: {
            slug,
          },
        });

        const {type, muscle, equipment, level} = data.details
        console.log(`Exercise ${i} ${name}: ${type}, ${muscle}, ${equipment}, ${level}`)  
        
        stringifier.write({name, slug, type, muscle, equipment, level})
      } catch (err) {
        console.log(
          `Error fetching ${exercises[i]} index: ${i} error: ${err.message}`
        );
      }
    }
  } catch (err) {
    console.log(err.message);
  }
};

readExercisesData();

// getExercisesData()
