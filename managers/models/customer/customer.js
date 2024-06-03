const mongoose = require('mongoose');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// Define user schema
const clientSchema = new mongoose.Schema({
    token: {
        type : String,
        default: null
    }, 
    name: {
        type: String,
        required: true,
        maxLength: 200
    },
    email:  { 
        type: String,
        required: false,
        maxLength: 200
    },
    phone:  { 
        type: String,
        required: true,
        maxLength: 200
    },
    status : {
        type: Boolean,
        default : true        
    },
    address: {
        type: String,
        required: true,
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

const Client = mongoose.model('Client', clientSchema);
module.exports = Client
