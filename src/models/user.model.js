const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const userSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        unique:true,
        lowercase: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            "Invalid email address"
        ]
    },

    name:{
        type:String,
        required: [true,"Name is required for creating a account"],
        
    },
    password:{
        type:String,
        required:[true,"password is required for creating a account"],
        minlen: [6,"password should contain more than 6 character"],
        select: false
    },
    systemUser:{
        type: Boolean,
        default: false,
        immutable: true,
        select: false
    }
 }, {
        timestamps:true
    
})

// before saving the userdata this function will execute which will hash the password
userSchema.pre("save",async function(next) {
    if(!this.isModified("password") ) {
        return 
    }

    const hash = await bcrypt.hash(this.password,10)
    this.password = hash

    return 
})

userSchema.methods.comparePassword = async function(password) {
    console.log(password,this.password);
    
    return await bcrypt.compare(password,this.password)
}

const userModel = mongoose.model("user",userSchema);

module.exports = userModel;