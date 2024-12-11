import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: [
            "full-time",
            "part-time",
            "research",
            "teaching",
            "project",
            "scholarship",
            "internship",
            "fellowship",
            "consultancy",
            "others"
        ]
    },
    locationType: {
        type: String,
        required: true,
        enum: [
            "remote",
            "onsite",
            "hybrid"
        ]
    },
    location: {
        type: String
    },
    duration: {
        type: String
    },
    recommendedSkills: [{
        skill: {
            type: String,
            required: true
        },
        description: {
            type: String
        }
    }],
    status: {
        type: String,
        required: true,
        enum: [
            "open",
            "closed"
        ],
        default: "closed"
    },
    candidates: {
        type: [{
            relevancyScore: {
                type: Number,
                default: 0
            },
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Candidate'
            }
        }],
        default: []
    },
    experts: {
        type: [{
            profileScore: {
                type: Number,
                default: 0,
            },
            relevancyScore: {
                type: Number,
                default: 0,
            },
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Expert',
            },
        }],
        default: [],
    },
    feedbacks: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Feedback'
        }],
        default: []
    },
}, {
    timestamps: true
});

const Subject = mongoose.model('Subject', subjectSchema);

export default Subject;