const mongoose = require('mongoose');
const createdDate = new Date();
const ist = createdDate.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
  });

const vendorSchema = new mongoose.Schema({
    name : {
        type: String,
        required: true
    },
    address : {
        type: String,
        required: true
    },
    phone : {
        type: String,
        required: true  
    },
    created_date: {
        type: Date,
        default: Date.now,
    },
    updated_date: {
        type: Date,
        default: Date.now,
    }
});

const Vendor = mongoose.model('Vendor', vendorSchema);

module.exports = Vendor;