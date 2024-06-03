const mongoose = require('mongoose');
const bcrypt = require('bcrypt')

    // Define user schema
    const userSchema = new mongoose.Schema({
        token: {
            type : String,
            default: null
        }, 
        profile:{
            type: String,
            required: true,
            default : 'default.jpeg',
        },
        first_name: {
            type: String,
            required: true,
            maxLength: 200
        },
        last_name: {
            type: String,
            required: true,
            maxLength: 200
        },
        email:  { 
            type: String,
            required: true,
            maxLength: 200
        },
        password:  { 
            type: String,
            required: false,
            maxLength: 200
        },  
        phone:  { 
            type: String,
            required: true,
            maxLength: 200
        },
        is_active:  { 
            type: Boolean,
            required: true,
        },

        status : {
            type: Boolean,
            default : true        
        },
        created_date: {
            type:Date,
            default: Date.now
        },
        updated_date: {
            type:Date,
            default: Date.now
        },
    });

// Define the comparePassword method for the userSchema
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
      return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
      console.error('Error comparing passwords:', error);
      return false;
    }
};
const User = mongoose.model('User', userSchema);
module.exports = User
