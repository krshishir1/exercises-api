const axios = require("axios")
const cheerio = require("cheerio")

const exerciseUrl = "https://www.bodybuilding.com/exercises/"
const axiosInstance = axios.create({
    baseURL: exerciseUrl,
    headers: {
        "Content-Type": "application/json",
    }
})


const extract_exercies = async (req, res) => {
    try {

        const pageIndex = req.params.index

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

        res.status(200).json({message: "Everything is working!", list: exerciseList})

    } catch(err) {
        console.log(err.message)

        res.status(500).json({errMsg: err.message})
    }
}

const exercise_info = async (req, res) => {
    try {

        const {data} = await axiosInstance.get(`/${req.query.slug}`)

        const $ = cheerio.load(data)
        const block = $(".ExDetail")

        let desc = block.find(".ExDetail-shortDescription p").first().text().trim()
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

        const postureImg = block.find(`.ExDetail-guide img.ExImg`).first().attr("src")

        const instruction = []
        block.find(`.ExDetail-guide [itemprop="description"] ol li`).each((i, el) => {
            let guideText = $(el).text().trim()
            instruction.push({index: i + 1, guide: guideText})
        })

        const details = {description: desc, benefits, images, postureImg, instruction}

        // console.log(text)

        res.status(200).json({...details})

    } catch(err) {
        console.log(err.message)

        res.status(500).json({errMsg: err.message})
    }
}

module.exports = {
    extract_exercies,
    exercise_info
}