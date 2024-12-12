import mongoose from "mongoose";
 const extraExpert= new mongoose.Schema({   
    name: {
        type: String,
        required: true
    },
    link: { 
        type: String,
        required: true
    },
    institution: {
        type: String,
        required: true
    },
    interests: {
        type: String,
        required: true
    }
});
const extraExperts = mongoose.model("extraExperts", extraExpert);
export default extraExperts;

