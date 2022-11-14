const express = require('express')
const expressHandlebars = require('express-handlebars')
const socket = require("socket.io");
const cookieParser = require('cookie-parser')
const expressSession = require('express-session')
const cors = require('cors')
const csrf = require('csurf')

const createAuth = require('./libs/auth')
const { credentials } = require('./config')

require('./libs/db')

const app = express()

app.use('/api', cors())

// configure Handlebars view engine
app.engine('handlebars', expressHandlebars({
  defaultLayout: 'main',
  helpers: {
    section: function(name, options) {
      if(!this._sections) this._sections = {}
      this._sections[name] = options.fn(this)
      return null
    },
  },
}))
app.set('view engine', 'handlebars')
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cookieParser(credentials.cookieSecret))
app.use(expressSession({
  resave: false,
  saveUninitialized: false,
  secret: credentials.cookieSecret,
  // store: new RedisStore({
  //   url: credentials.redis.url,
  //   logErrors: true,
  // }),
}))

// security configuration
const auth = createAuth(app, {
	// baseUrl is optional; it will default to localhost if you omit it;
	// it can be helpful to set this if you're not working on
	// your local machine.  For example, if you were using a staging server,
	// you might set the BASE_URL environment variable to
	// https://staging.meadowlark.com
    baseUrl: process.env.BASE_URL, /// http://localhost:3000
    providers: credentials.authProviders,
    successRedirect: '/',
    failureRedirect: '/unauthorized',
})
// auth.init() links in Passport middleware:
auth.init()
// now we can specify our auth routes:
auth.registerRoutes()

app.use(csrf({ cookie: true }))
app.use((req, res, next) => {
  res.locals._csrfToken = req.csrfToken()
  next()
})

const port = process.env.PORT || 5000

app.use(express.static(__dirname + '/public'))
app.get('/login', (req, res) => {
  res.render('login')
})
app.get('/', (req, res) => {
  if (!req.user)
  {
      return res.redirect("/login")
  }
  console.log(req.user)
  res.render('index', { user: {name:req.user.name, id:req.user._id}, title: "Trang chủ" })
})
// we also need an 'unauthorized' page
app.get('/unauthorized', (req, res) => {
  res.status(403).render('unauthorized')
})
// and a way to logout
app.get('/logout', (req, res) => {
  req.logout()
  return res.redirect("/login")
})

app.use((req, res) => res.render('404'))
app.use((err, req, res, next) => {
  console.log(err)
  res.render('500')
})

const server = app.listen(port, () => {
  console.log( `Express started on http://localhost:${port}` +
    '; press Ctrl-C to terminate.' )
})

// Socket setup
const io = socket(server);

const activeUsers = new Set();

io.on("connection", function (socket) {
  console.log("Made socket connection");

  socket.on("new user", function (data) {
    socket.userId = data;
    activeUsers.add(data);
    io.emit("new user", [...activeUsers]);
  });

  socket.on("disconnect", () => {
    activeUsers.delete(socket.userId);
    io.emit("user disconnected", socket.userId);
  });

  socket.on("chat message", function (data) {
    //lưu vào CSDL.
    io.emit("chat message", data);
  });
  
  socket.on("typing", function (data) {
    socket.broadcast.emit("typing", data);
  });
});