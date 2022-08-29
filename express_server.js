const express = require("express");
const cookieParser = require('cookie-parser');
const { response } = require("express");

const PORT = 8080; // default port 8080

const app = express();
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true })); //to make the body in the POST request readable
app.use(cookieParser());

/* const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
}; */

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
  i34oGr: {
    longURL: "https://www.google.ca",
    userID: "abcdef",
  },
};


const users = {
  aJ48lW: { id: 'aJ48lW', email: 'gene.t@yahoo.com', password: 'abc' }
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

  for (let i = 0; i < 5; i++) {
    string += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return string;
}

const getUserByEmail = (email) => {
  for (const id in users) {
    if (users[id].email === email) {
      return users[id];
    }
  }
  return null;
}

const generateTemplateVarUser = (req) => {
  const userID = req.cookies["user_id"];
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
  const user = getUserByEmail(email);

  if (!email || !password) {
    return res.status(400).send("Email or password cannot be empty");
  }

  if (!user || user.password !== password) {
    return res.status(403).send("Invalid email or password");
  }

  res.cookie('user_id', user.id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
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

  if (getUserByEmail(email)) {
    return res.status(400).send("Email already taken");
  }

  const id = generateRandomString();
  const newUser = { id, email, password };
  users[id] = newUser;
  res.cookie('user_id', id);
  res.redirect("/urls");
})

app.get("/urls", (req, res) => {
  console.log("cookie user id", req.cookies["user_id"])
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

  urlDatabase[tinyURL] = longURL;
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

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
  const { user } = generateTemplateVarUser(req);

  console.log("user", user);
  if (!user) {
    return res.status(403).send("You need to be logged in to access this page");
  }

  //url id
  const id = req.params.id;
  console.log("url id", id);

  //check if url does not exist in the database
  if (!urlDatabase[id]) {
    return res.status(404).send("Page not found");
  }

  //check if url id belongs to the user id that is logged in 
  if (urlDatabase[id].userID !== user.id) {
    return res.status(403).send("Not allowed to view this page");
  }



  const templateVars = { id, longURL: urlDatabase[id].longURL, user };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const { longURL } = req.body;
  urlDatabase[id] = longURL;
  res.redirect("/urls");
});


app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];
  if (!longURL) {
    return res.status(404).send(`404. ${id} Not Found`);;
  }
  res.redirect(longURL);
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});