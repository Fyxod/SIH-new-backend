import mongoose from "mongoose";
 const extraExpert= new mongoose.Schema({   
    expertId: {
        type: String
    },
    name: { 
        type: String
    },
    designation: {
        type: String
    },
    department: {
        type: String
    },
    expertise: [{
        type: String,
    }],
    profileLink: {
        type: String
    },
    college: {
        type: String
    }
});

const extraExperts = mongoose.model("extraExperts", extraExpert);
export default extraExperts;

