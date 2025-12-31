import mongoose from "mongoose";

const userSchema = new mongoose.Schema( // defining the schema for User model
    {
        email: {
            type: String,
            required: true,
            unique: true
        },
        fullName: {
            type: String,
            required: true
        
        },
        password: {
            type: String,
            required: true,
            minlength: 6
        },
        profilePic: {
            type: String,
            default: "",
        },
        bio: {
            type: String,
            maxlength:150,
            default: "",
        }
    },
    { timestamps: true, } // to automatically create createdAt and updatedAt fields
    
);

const User = mongoose.model("User", userSchema);// creating a model named User using the userSchema
//the first letter of the model name should be capital because 

export default User;

