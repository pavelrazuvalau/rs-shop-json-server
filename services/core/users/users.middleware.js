const express = require('express');
const router = express.Router();

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

function getUserByToken(token) {
  return server.db.getState().users.find((user) => {
    const ret = user.token.toLowerCase() === token.toLowerCase();
    if (ret) console.log(user);
    return ret;
  });
}

function handleAddingToLists(listName, isAdding, req, res) {
  const { body } = req;
  const reqToken = req.header('Authorization').split(' ')[1];

  if (!reqToken) {
    return res.status(401).send('Unauthorized');
  }

  const matchedUser = getUserByToken(reqToken);

  if (body.id) {
    server.db.setState({
      ...server.db.getState(),
      users: server.db
        .getState()
        .users.map((user) =>
          user.token === matchedUser.token 
          ? {
            ...user,
            [listName]: isAdding 
              ? [...user[listName], body.id]
              : user[listName].filter(item => item !== body.id)
          } 
          : user
        ),
    });
  } else {
    res.status(400);
  }
}

module.exports = (server) => {
  router.post('/users/login', (req, res) => {
    const { body } = req;

    let users = server.db.getState().users,
      matchedUser = users.find((user) => {
        const ret = user.email.toLowerCase() === body.email.toLowerCase();
        if (ret) console.log(user);
        return ret;
      });

    if (!matchedUser) {
      res.status(401).send('Wrong username');
    } else if (matchedUser.password === body.password) {
      res.json({ token: matchedUser.token });
    } else {
      res.status(401).send('Wrong password');
    }
  });

  router.get('/users/userinfo', (req, res) => {
    const reqToken = req.header('Authorization').split(' ')[1];

    if (reqToken) {
      const matchedUser = getUserByToken(req);
      const { token, login, password, ...user } = matchedUser;

      res.json(user);
    } else {
      res.status(401).send('Unauthorized');
    }
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
    handleAddingToLists('favorites', true, req, res);
  });

  router.delete('/users/favorites', (req, res) => {
    handleAddingToLists('favorites', false, req, res);
  });

  router.post('/users/cart', (req, res) => {
    handleAddingToLists('cart', true, req, res);
  });

  router.delete('/users/cart', (req, res) => {
    handleAddingToLists('cart', false, req, res);
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
