const express = require('express');
const router = express.Router();
const url = require('url');

function makeToken(length = 10) {
  var result = '';
  var characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function getUserByToken(server, token) {
  return server.db.getState().users.find((user) => {
    const ret = user.token.toLowerCase() === token.toLowerCase();
    if (ret) console.log(user);
    return ret;
  });
}

function handleAddingToLists(server, listName, isAdding, req, res) {
  const { body } = req;
  const authorizationHeader = req.header('Authorization').split(' ');
  const authorizationMethod = authorizationHeader[0];
  const reqToken = authorizationHeader[1];

  if (!reqToken || authorizationMethod !== 'Bearer') {
    return res.status(401).send('Unauthorized');
  }

  const matchedUser = getUserByToken(server, reqToken);
  const goodId = isAdding ? body.id : url.parse(req.originalUrl, true).query.id

  if (goodId) {
    server.db.setState({
      ...server.db.getState(),
      users: server.db.getState().users.map((user) =>
        user.token === matchedUser.token
          ? {
              ...user,
              [listName]: isAdding
                ? [...user[listName], goodId]
                : user[listName].filter((item) => item !== goodId),
            }
          : user
      ),
    });
    res.send(200);
  } else {
    res.status(400);
  }
}

module.exports = (server) => {
  router.post('/users/login', (req, res) => {
    const { body } = req;

    let users = server.db.getState().users,
      matchedUser = users.find((user) => {
        const ret = user.login.toLowerCase() === body.login.toLowerCase();
        if (ret) console.log(user);
        return ret;
      });

    if (!matchedUser) {
      res.status(401).send('Wrong username or password');
    } else if (matchedUser.password === body.password) {
      res.json({ token: matchedUser.token });
    } else {
      res.status(401).send('Wrong username or password');
    }
  });

  router.get('/users/userInfo', (req, res) => {
    const authorizationHeader = req.header('Authorization').split(' ');
    const authorizationMethod = authorizationHeader[0];
    const reqToken = authorizationHeader[1];

    if (!reqToken || authorizationMethod !== 'Bearer') {
      return res.status(401).send('Unauthorized');
    }

    const matchedUser = getUserByToken(server, reqToken);
    const { token, login, password, ...user } = matchedUser;

    res.json(user);
  });

  router.post('/users/register', (req, res) => {
    const token = makeToken();

    server.db.setState({
      ...server.db.getState(),
      users: server.db.getState().users.concat({
        ...req.body,
        token,
        cart: [],
        favorites: [],
        orders: [],
      }),
    });

    res.json({ token });
  });

  router.post('/users/favorites', (req, res) => {
    handleAddingToLists(server, 'favorites', true, req, res);
  });

  router.delete('/users/favorites', (req, res) => {
    handleAddingToLists(server, 'favorites', false, req, res);
  });

  router.post('/users/cart', (req, res) => {
    handleAddingToLists(server, 'cart', true, req, res);
  });

  router.delete('/users/cart', (req, res) => {
    handleAddingToLists(server, 'cart', false, req, res);
  });

  // router.post('/users/order', (req, res) => {
  //   handleAddingToLists('order', true, req, res);
  // });

  // router.put('/users/order', (req, res) => {});

  // router.delete('/users/order', (req, res) => {
  //   handleAddingToLists('order', false, req, res);
  // });

  return router;
};
