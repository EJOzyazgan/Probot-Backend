const ENVIRONMENT = require('./environment');

exports.CONFIG = {
  nodeEnv: ENVIRONMENT.ENV,
  uiUrl: ENVIRONMENT.UIURL,
  apiUrl: ENVIRONMENT.APIURL,
  dbUrl: ENVIRONMENT.DBURL
};
