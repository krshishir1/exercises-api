const axios = require("axios")
const cheerio = require("cheerio")
const Joi = require("joi")

const exerciseUrl = "https://www.bodybuilding.com/exercises/"
const axiosInstance = axios.create({
    baseURL: exerciseUrl,
    headers: {
        "Content-Type": "application/json",
    }
})

const download_image = async (url, filename) => {
    try {
        const writeStream = fs.createWriteStream(filename)
        const {data} = await axios.get(url, {responseType: "stream"})
        console.log(data)
    } catch(err) {
        console.log(err.message)
    }
}


const extract_exercies = async (req, res) => {
    try {

        const pageIndex = req.params.index

        const schema = Joi.object({
            muscle: Joi.string().required().trim(false),
        })

        const {error} = schema.validate(req.query)

        if(error) throw new Error(error.message)

        const {status, data} = await axiosInstance.get(`/finder/${pageIndex}`, {
            params: req.query
        })

        const $ = cheerio.load(data)
        const exerciseList = []

        $("h3.ExHeading a").each((i, el) => {
            exerciseList.push({
                name: $(el).text().trim(),
                slug: $(el).attr("href").split("/").pop()
            })
        })

        res.status(200).json({results: exerciseList})

    } catch(err) {
        console.log(err.message)

        res.status(500).json({errMsg: err.message})
    }
}

const exercise_info = async (req, res) => {
    try {

        console.log(req.query.slug)

        const {data} = await axiosInstance.get(`/${req.query.slug}`)

        const $ = cheerio.load(data)
        const block = $(".ExDetail")

        const details = {type: false, muscle: false, equipment: false, level: false}

        const detailCon = block.find(`.ExDetail-section ul.bb-list--plain`).first()
        detailCon.find("li").each((i, el) => {

            let innerText = $(el).text().toLowerCase()

            if(innerText.includes("type")) details.type = $(el).find("a").text().trim().toLowerCase()
            if(innerText.includes("muscle")) details.muscle = $(el).find("a").text().trim().toLowerCase()
            if(innerText.includes("equipment")) details.equipment = $(el).find("a").text().trim().toLowerCase()
            if(innerText.includes("level")) details.level = innerText.replace(/level:/g, "").replace(/\s+/g, " ").trim().toLowerCase()

            // if(i === 0) details.type = $(el).find("a").text().trim().toLowerCase()
            // else if(i === 1) details.muscle = $(el).find("a").text().trim().toLowerCase()
            // else if(i === 2) details.equipment = $(el).find("a").text().trim().toLowerCase()
            // else if(i === 3) {
            //     details.level = $(el).text().replace(/Level:/g, "").replace(/\s+/g, " ").trim().toLowerCase()
            // }

        })


        let desc = block.find(".ExDetail-shortDescription p").first().text().trim();
        if(desc == "") desc = false;

        let benefits = []

        block.find(".ExDetail-benefits ol li").each((i, el) => {
            let benefit = $(el).text().trim()
            benefits.push(benefit)
        })

        let images = []
        block.find(`.ExDetail-imgWrap img`).each((i, el) => {
            let imageSrc = $(el).attr("src")
            images.push(imageSrc)
        })

        const postureImg = block.find(`.ExDetail-guide img.ExImg`).first().attr("src") || false

        const instruction = []
        block.find(`.ExDetail-guide [itemprop="description"] ol li`).each((i, el) => {
            let guideText = $(el).text().trim()
            instruction.push({index: i + 1, guide: guideText})
        })

        Object.keys(details).forEach(key => {
            if(details[key] === false) delete details[key]
        })

        let info = {details, 
            description: desc, 
            benefits: benefits.length > 0 ? benefits : false, 
            instruction: instruction.length > 0 ? instruction : false,
            images: images.length > 0 ? images : false, 
            postureImg, 
        }

        Object.keys(info).forEach(key => {
            if(info[key] === false) delete info[key]
        })
        // console.log(text)

        res.status(200).json({...info})

    } catch(err) {
        console.log(err.message)

        res.status(500).json({errMsg: err.message})
    }
}

module.exports = {
    extract_exercies,
    exercise_info
}