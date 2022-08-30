/*
Get the user object from the database that matches the user's email
return user object or null
*/
const getUserByEmail = function (email, database) {
  for (const id in database) {
    if (database[id].email === email) {
      return database[id];
    }
  }
  return undefined;
};


module.exports = { getUserByEmail };