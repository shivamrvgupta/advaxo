const XLSX = require('xlsx');
const csvParser = require('csv-parser');
const fs = require('fs');
const models = require('../models');
const path = require("path"); 


module.exports = {
    handleCSV : (filePath, res) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                console.log(results);
                models.ProductModel.Transaction.insertMany(results)
                    .then(() => res.json({ message: 'Data successfully inserted' }))
                    .catch((err) => res.json({ error: err.message }));
            });
    },
    handleXLS : (filePath, res) => {
        const workbook = XLSX.readFile(filePath);
        console.log(workbook);
        const sheetName = workbook.SheetNames[0];
        console.log(sheetName);
        const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        console.log(sheet);
    
        models.ProductModel.Transaction.insertMany(sheet)
            .then(() => res.json({ message: 'Data successfully inserted' }))
            .catch((err) => res.status(500).json({ error: err.message }));
    }       
}


