require('dotenv').config();

exports.ENV = process.env.NODE_ENV;
exports.PORT = process.env.PORT || '3000';
exports.UIURL = process.env.UIURL;
exports.APIURL = process.env.APIURL;
exports.DBURL = process.env.DATABASE_URL;
