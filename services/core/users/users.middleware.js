const express = require("express");
const router = express.Router();

function makeToken(length = 10) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

module.exports = (server) => {
  router.post("/users/login", (req, res) => {
    const { body } = req;

    let users = server.db.getState().users,
      matchedUser = users.find((user) => {
        const ret = user.email.toLowerCase() === body.email.toLowerCase();
        if (ret) console.log(user);
        return ret;
      });

    if (!matchedUser) {
      res.status(401).send("Wrong username");
    } else if (matchedUser.password === body.password) {
      res.json({ token: matchedUser.token });
    } else {
      res.status(401).send("Wrong password");
    }
  });

  router.get("/users/userinfo", (req, res) => {
    const reqToken = req.header("Authorization").split(' ')[1];

    if (reqToken) {
      let users = server.db.getState().users,
        matchedUser = users.find((user) => user.token === reqToken);

      const { token, ...user } = matchedUser;

      res.json(user);
    } else {
      res.status(401).send("Unauthorized");
    }
  });

  router.post("/users/register", (req, res) => {
    const token = makeToken();

    server.db.setState({
      ...server.db.getState(),
      users: server.db.getState().users.concat({
        ...req.body,
        token
      }),
    });

    res.json({ token });
  });

  return router;
};
