const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.strictEqual(user.id, expectedUserID);
  });

  it('should return undefined with invalid email', () => {
    const user = getUserByEmail("notexists@example.com", testUsers);
    assert.isUndefined(user);

  });

  it('should return undefined with empty string email', () => {
    const user = getUserByEmail("", testUsers);
    assert.isUndefined(user);
  });

  it('should return undefined with null email', () => {
    const user = getUserByEmail(null, testUsers);
    assert.isUndefined(user);
  });

  it('should return undefined with null db', () => {
    const user = getUserByEmail("user@example.com", null);
    assert.isUndefined(user);
  });
});