const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const {mongoose} = require('./db/mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const bodyParser = require('body-parser');

const usersRouter = require('./routes/users');
const tournamentRouter = require('./routes/tournament');
const botRouter = require('./routes/bot');

const port = process.env.PORT || 3000;

const app = express();

const http = require('http').Server(app);
const io = require('socket.io')(http);

require('./config/passport');

app.use(function (req,res,next) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader('Access-Control-Allow-Methods', "PUT, PATCH, GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, auth");
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

io.on('connection', (socket) => {
  console.log("Connected to Socket!!"+ socket.id);
  exports.socket = socket;
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

app.use('/tournament', tournamentRouter);
app.use('/user', usersRouter);
app.use('/bot', botRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

app.use(session({
  store: new MongoStore({mongooseConnection: mongoose.connection})
}));

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

http.listen(port, () => console.log(`Listening on port ${port}`));

exports.server = http;
exports.io = io;
