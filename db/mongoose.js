const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI ||`mongodb://localhost:27017/AceCode`, {useNewUrlParser: true}, (err, db) => {
    if(err){
        console.log(err);
    }else{
        console.log("DB Connected");
    }
});

module.exports = {mongoose};
