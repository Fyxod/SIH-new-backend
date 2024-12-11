import mongoose from "mongoose";

const expertSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true,
        enum: [
            "male",
            "female",
            "non-binary",
            "other"
        ]
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    mobileNo: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    skills: [{
        skill: {
            type: String,
            required: true
        },
        duration: {
            type: Number
        }
    }],
    currentPosition: {
        type: String,
        required: true
    },
    currentDepartment: {
        type: String,
        required: true
    },
    bio: {
        type: String,
    },
    experience: [{
        department: {
            type: String,
            // required: true
        },
        position: {
            type: String,
            // required: true
        },
        startDate: {
            type: Date,
            // required: true
        },
        endDate: {
            type: Date,
            // required: true
        },
        companyName: {
            type: String,
        },
    }],
    education: [{
        degree: {
            type: String,
        },
        field: {
            type: String,
        },
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
        institute: {
            type: String,
        },
    }],
    resume: {
        type: String,
        unique: true,
        sparse: true
    },
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    }],
    feedbacks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Feedback'
    }],
    candidates: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Candidate'
    }],
    image: {
        type: String,
        unique: true,
        sparse: true
    },
    linkedIn: {
        type: String,
        unique: true,
        sparse: true
    },
    averageProfileScore: {
        type: Number,
        default: 0
    },
    averageRelevancyScore: {
        type: Number,
        default: 0
    },
    averageFeedbackScore: {
        type: Number,
        default: 0
    }
},
    {
        timestamps: true
    });

const Expert = mongoose.model('Expert', expertSchema);

export default Expert;