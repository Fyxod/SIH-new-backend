import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema({
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
    bio: {
        type: String
    },
    experience: [{
        position: {
            type: String,
            required: true
        },
        department: {
            type: String,
            required: true
        },
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date
        },
        companyName: {
            type: String,
        },
    }],
    education: [{
        degree: {
            type: String
        },
        field: {
            type: String
        },
        startDate: {
            type: Date
        },
        endDate: {
            type: Date
        },
        institute: {
            type: String
        },
    }],
    resume: {
        type: String,
        unique: true,
        sparse: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    },
    feedbacks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Feedback'
    }],
    image: {
        type: String,
        unique: true,
        sparse: true
    },
    // image is string ????? yes
    linkedIn: {
        type: String,
        unique: true,
        sparse: true
    },
    relevancyScore: {
        type: Number,
        default: 0
    },
    panel: {
        type: [
            {
                expert: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Expert',
                    required: true
                },
                feedback: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Feedback',
                    default: null
                }
            }
        ],
        default: []
    },
    status: {
        type: String,
        required: true,
        enum: [ 
            "scheduled",
            "completed",
            "pending",
        ],
        default: "pending"
    },
    appliedOn: {
        type: Date,
        required: true,
        default: Date.now
    },
    interviewDetails: {
        date: {
            type: Date
        },
        time: {
            type: String
        },
        platform: {
            type: String,
            enum: [
                "zoom",
                "googleMeet",
                "microsofTeams",
                "offline"
            ]
        },
        link: {
            type: String,
            default: null
        },
        venue: {
            type: String,
            default: null
        },
        conducted: {
            type: Boolean,
            default: false
        },
        expertNotes: {
            type: [
                {
                    expert: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'Expert',
                        required: true
                    },
                    note: {
                        type: String,
                        default: ''
                    }
                }
            ],
            default: []
        }
    }

    // status: {
    //     type: String,
    //     enum: ["active", "inactive"], 
    //     default: "active", 
    //     // required: true,
    // }

    //extra unnecessary fields - may add if time permits
    // isBlocked: {
    //     type: Boolean,
    //     default: false
    // },
    // isVerified: {
    //     type: Boolean,
    //     default: false
    // },
    // verificationToken: {
    //     type: String,
    //     default: null
    // },
    // resetPasswordToken: {
    //     type: String,
    //     default: null
    // },
    // resetPasswordExpires: {
    //     type: Date,
    //     default: null
    // }
},
    {
        timestamps: true
    });

const Candidate = mongoose.model('Candidate', candidateSchema);

export default Candidate;