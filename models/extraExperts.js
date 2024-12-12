import mongoose from "mongoose";
 const extraExpert= new mongoose.Schema({   
    expertId: {
        type: String,
        required: true
    },
    name: { 
        type: String,
        required: true
    },
    designation: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    expertise: [{
        type: String,
        required: true
    }],
    profileLink: {
        type: String,
        required: true
    },
    college: {
        type: String,
        required: true
    }
});

const extraExperts = mongoose.model("extraExperts", extraExpert);
export default extraExperts;

