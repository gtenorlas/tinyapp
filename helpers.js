/*
Get the user object from the database that matches the user's email
return user object or null
*/
const getUserByEmail = function(email, database) {
  for (const id in database) {
    if (database[id].email === email) {
      return database[id];
    }
  }
  return undefined;
};

/*
Retrieve all urls that belongs to the user that is logged in
*/
const urlsForUser = (userID, urlDatabase) => {
  const urls = {};
  for (const id in urlDatabase) {
    if (urlDatabase[id].userID === userID) {
      urls[id] = urlDatabase[id].longURL;
    }
  }
  return urls;
};

const generateRandomString = function() {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let string = "";
  let charactersLength = characters.length;

  for (let i = 0; i < 6; i++) {
    string += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return string;
};

const generateTemplateVarUser = (req, users) => {
  const userID = req.session.user_id; //cookie-session
  const user = users[userID] === undefined ? null : users[userID];
  const templateVars = {
    user
  };
  return templateVars;
};

/*
Helper function to validate if the visitor for the shortURL is unique or not
*/
const isUniqueVisitor = (visitorID, urlID, urlDatabase) => {
  for (const each of urlDatabase[urlID].visitLogs) {
    if (each.visitorID === visitorID) {
      return false;
    }
  }
  return true;
};


module.exports = { getUserByEmail, urlsForUser, generateRandomString, generateTemplateVarUser, isUniqueVisitor };