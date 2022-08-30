const express = require("express");
//const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session')
//const { response } = require("express");
const bcrypt = require("bcryptjs");
const methodOverride = require('method-override');
const { getUserByEmail } = require("./helpers");

const PORT = 8080; // default port 8080

const app = express();

//middlewares
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true })); //to make the body in the POST request readable
//app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['abc12345key'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))
// override with POST having ?_method=DELETE
app.use(methodOverride('_method'))

/* const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
}; */

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
    visitedCount: 0,
    uniqueVisit: 0,
    visitLogs: []
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
    visitedCount: 3,
    uniqueVisit: 2,
    visitLogs: []
  },
  i34oGr: {
    longURL: "https://www.google.ca",
    userID: "abcdef",
    visitedCount: 0,
    uniqueVisit: 0,
    visitLogs: []
  },
};


const users = {
  aJ48lW: { id: 'aJ48lW', email: 'gene.t@yahoo.com', password: '$2a$10$bdYMxRHnInkT9y1TVBAneeyjM612q5uKf0DxGGKVXufjIM3eYk3Ye' }
};

const urlsForUser = (userID) => {
  const urls = {};
  for (const id in urlDatabase) {
    if (urlDatabase[id].userID === userID) {
      urls[id] = urlDatabase[id].longURL;
    }
  }
  return urls;
}


const generateRandomString = function () {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let string = "";
  let charactersLength = characters.length;

  for (let i = 0; i < 6; i++) {
    string += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return string;
}

const generateTemplateVarUser = (req) => {
  //const userID = req.cookies["user_id"]; //cookie-parser
  const userID = req.session.user_id; //cookie-session
  const user = users[userID] === undefined ? null : users[userID];
  const templateVars = {
    user
  };
  return templateVars;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  const templateVars = { greeting: "Hello World!" };
  res.render("hello_world", templateVars);
});

app.get("/set", (req, res) => {
  const a = 1;
  res.send(`a = ${a}`);
});

app.get("/fetch", (req, res) => {
  res.send(`a = ${a}`);
});

app.get("/login", (req, res) => {
  const { user } = generateTemplateVarUser(req);
  //user already logged in -> redirect to /urls page
  if (user) {
    return res.redirect("/urls");
  }
  res.render("login", { user: null });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);

  if (!email || !password) {
    return res.status(400).send("Email or password cannot be empty");
  }

  //bcrypt.compareSync("purple-monkey-dinosaur", hashedPassword);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Invalid email or password");
  }

  //res.cookie('user_id', user.id); //cookie-parser
  req.session.user_id = user.id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  //res.clearCookie("user_id"); //cookie-parser
  req.session.user_id = null;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const { user } = generateTemplateVarUser(req);
  //user already logged in -> redirect to /urls page
  if (user) {
    return res.redirect("/urls");
  }
  res.render("register", { user: null });
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Invalid email or password");
  }

  if (getUserByEmail(email, users)) {
    return res.status(400).send("Email already taken");
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = generateRandomString();
  const newUser = { id, email, password: hashedPassword };
  console.log("New registered user: ", newUser);
  users[id] = newUser;
  console.log("all users", users);
  //res.cookie('user_id', id);
  req.session.user_id = id; //cookie-session
  res.redirect("/urls");
})

app.get("/urls", (req, res) => {
  const { user } = generateTemplateVarUser(req);

  //user not logged in
  if (!user) {
    return res.status(403).send("You need an account to access this page");
  }

  //retrieve all urls that pertain to the userID
  const urls = urlsForUser(user.id);

  const templateVars = {
    user,
    urls
  };
  res.render("urls_index", templateVars);

});

app.post("/urls", (req, res) => {
  const { user } = generateTemplateVarUser(req);

  if (!user) {
    return res.status(403).send("You need an account to access this page");
  }

  const tinyURL = generateRandomString();
  const longURL = req.body.longURL;
  const userID = user.id;

  urlDatabase[tinyURL] = { longURL, userID };
  console.log("Url database: ", urlDatabase)
  res.redirect(`urls/${tinyURL}`);
});

/*
  NOTE: 
  ! The GET /urls/new route needs to be defined before the GET /urls/:id route. Routes defined earlier will take precedence,
  so if we place this route after the /urls/:id definition, any calls to /urls/new will be handled by app.get("/urls/:id", ...) 
  because Express will think that new is a route parameter. A good rule of thumb to follow is that routes should be ordered
  from most specific to least specific.
*/
app.get("/urls/new", (req, res) => {
  const templateObj = generateTemplateVarUser(req);
  const { user } = templateObj;
  //user not logged in
  if (!user) {
    return res.redirect("/login");
  }
  res.render("urls_new", templateObj);
});

app.delete("/urls/:id", (req, res) => {
  console.log("in the delete route");
  const { user } = generateTemplateVarUser(req);
  //url id
  const id = req.params.id;

  if (!user) {
    return res.status(403).send("You need to be logged in to access this page");
  }

  //check if url does not exist in the database
  if (!urlDatabase[id]) {
    return res.status(404).send("Page not found");
  }

  //check if url id belongs to the user id that is logged in 
  if (urlDatabase[id].userID !== user.id) {
    return res.status(403).send("Not allowed to view this page");
  }

  delete urlDatabase[id];
  res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
  const { user } = generateTemplateVarUser(req);
  //url id
  const id = req.params.id;

  if (!user) {
    return res.status(403).send("You need to be logged in to access this page");
  }

  //check if url does not exist in the database
  if (!urlDatabase[id]) {
    return res.status(404).send("Page not found");
  }

  //check if url id belongs to the user id that is logged in 
  if (urlDatabase[id].userID !== user.id) {
    return res.status(403).send("Not allowed to view this page");
  }

  const templateVars = { id, user, longURL: urlDatabase[id].longURL };
  res.render("urls_show", templateVars);
});

app.put("/urls/:id", (req, res) => {
  console.log("in put id");
  const { user } = generateTemplateVarUser(req);
  //url id
  const id = req.params.id;

  if (!user) {
    return res.status(403).send("You need to be logged in to access this page");
  }

  //check if url does not exist in the database
  if (!urlDatabase[id]) {
    return res.status(404).send("Page not found");
  }

  //check if url id belongs to the user id that is logged in 
  if (urlDatabase[id].userID !== user.id) {
    return res.status(403).send("Not allowed to view this page");
  }

  const { longURL } = req.body;
  urlDatabase[id].longURL = longURL;
  res.redirect("/urls");
});


app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id].longURL;
  if (!longURL) {
    return res.status(404).send(`404. ${id} Not Found`);;
  }
  res.redirect(longURL);
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});