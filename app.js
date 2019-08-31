const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const bodyParser = require('body-parser');
const models = require('./models');

const routeIndex = require('./routes/index');

const port = process.env.PORT || 3000;

const app = express();

const http = require('http').Server(app);
const io = require('socket.io')(http);

require('./config/passport');

// Start cron jobs
require('./controllers/cron');

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader('Access-Control-Allow-Methods', "PUT, PATCH, GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Authorization");
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

io.on('connection', (socket) => {
  console.log("Connected to Socket!!" + socket.id);

  socket.on('room', (room) => {
    socket.join(room);
  });
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.use('/api', routeIndex);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

if (process.env.RUN_MIGRATIONS === 'true') {
  models.sequelize.sync({ alter: true }).then(() => {
    http.listen(port, () => {
      console.log(`Listening on port ${port}!`)
    });
  });
} else {
  http.listen(port, () => {
    console.log(`Listening on port ${port}!`)
  });
}

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

exports.server = http;
exports.io = io;
