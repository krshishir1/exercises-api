const mongoose = require("mongoose");
const { Schema } = mongoose;

const detailsSchema = new Schema({
    type: String,
    muscle: {
        type: String,
        required: true,
    },
    equipment: String,
    level: String,
})

const schema = new Schema({
    name: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
    },
    details: detailsSchema,
    instruction: {
        type: Array,
        default: undefined,
    },
    description: String,
    benefits: {
        type: Array,
        default: undefined,
    },
    images: {
        type: Array,
        default: undefined,
    },
    muscle: String,
}, {
    minimize: true,
    capped: {
        size: Math.pow(50, 8),
        max: 5000,
        autoIndexId: true
    }
})

const ExerciseModel = mongoose.model("Exercise", schema);

module.exports = ExerciseModel;