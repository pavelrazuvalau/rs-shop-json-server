// REWRITE EXAMPLE
const express = require('express');
const jsonServer = require('json-server');
const router = express.Router();

router.use(jsonServer.rewriter({
  '/users/register': '/users/register',
	'/users/login': '/users/login',
	'/users/userInfo': '/users/userInfo',
  '/users/favorites': '/users/favorites',
  '/users/cart': '/users/cart',
  '/users/order': '/users/order',
}));

module.exports = router;
