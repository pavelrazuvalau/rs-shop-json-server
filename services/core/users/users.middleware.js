const { match } = require('assert');
const express = require('express');
const router = express.Router();
const url = require('url');

function makeToken(length = 24) {
  var result = '';
  var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function getUserByToken(req, res, server) {
  const authorizationHeader = req.header('Authorization').split(' ');
  const authorizationMethod = authorizationHeader[0];
  const reqToken = authorizationHeader[1];

  if (!reqToken || authorizationMethod !== 'Bearer') {
    return res.status(401).send('Unauthorized');
  }

  return server.db.getState().users.find((user) => {
    const ret = user.token.toLowerCase() === reqToken.toLowerCase();
    if (ret) console.log(user);
    return ret;
  });
}

function handleAddingToLists(server, listName, isAdding, req, res) {
  const { body } = req;
  const matchedUser = getUserByToken(req, res, server);

  if (!matchedUser) {
    return res.status(401).send('Unauthorized');
  }

  const goodId = isAdding ? body.id : url.parse(req.originalUrl, true).query.id;

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

function getAllGoods(server) {
  const goods = server.db.getState().goods;
  const categories = Object.keys(goods);
  const subCategories = categories
    .map((category) => Object.keys(goods[category]))
    .flat();
  return categories
    .map((category) =>
      subCategories.map((subCategory) => goods[category][subCategory])
    )
    .flat(3)
    .filter(Boolean);
}

function reduceAvailableCount(server, items) {
  const allGoods = getAllGoods(server);

  items.forEach(purchasedItem => {
    const item = allGoods.find(it => it.id === purchasedItem.id);
    item.availableAmount -= purchasedItem.amount;
  })
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
    const matchedUser = getUserByToken(req, res, server);

    if (!matchedUser) {
      return res.status(401).send('Unauthorized');
    }

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

  router.post('/users/order', (req, res) => {
    const { body } = req;
    const matchedUser = getUserByToken(req, res, server);

    if (!matchedUser) {
      return res.status(401).send('Unauthorized');
    }

    server.db.setState({
      ...server.db.getState(),
      users: server.db.getState().users.map((user) =>
        user.token === matchedUser.token
          ? {
              ...user,
              orders: user.orders.concat({
                id: makeToken(10),
                items: body.items,
                details: {
                  name: body.details.name,
                  address: body.details.address,
                  phone: body.details.phone,
                  timeToDeliver: body.details.timeToDeliver,
                  comment: body.details.comment,
                },
              }),
              cart: [],
            }
          : user
      ),
    });

    reduceAvailableCount(server, body.items);
    res.send(200);
  });

  router.put('/users/order', (req, res) => {
    const { body } = req;
    const matchedUser = getUserByToken(req, res, server);

    if (!matchedUser) {
      return res.status(401).send('Unauthorized');
    }

    server.db.setState({
      ...server.db.getState(),
      users: server.db.getState().users.map((user) =>
        user.token === matchedUser.token
          ? {
              ...user,
              orders: user.orders.map((order) =>
                order.id === body.id
                  ? { ...order, details: body.details }
                  : order
              ),
            }
          : user
      ),
    });

    res.send(200);
  });

  router.delete('/users/order', (req, res) => {
    const { body } = req;
    const matchedUser = getUserByToken(req, res, server);

    if (!matchedUser) {
      return res.status(401).send('Unauthorized');
    }

    server.db.setState({
      ...server.db.getState(),
      users: server.db.getState().users.map((user) =>
        user.token === matchedUser.token
          ? {
              ...user,
              orders: user.orders.filter((order) => order.id !== body.id),
            }
          : user
      ),
    });

    res.send(204);
  });

  return router;
};
