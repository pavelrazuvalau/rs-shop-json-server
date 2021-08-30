// REWRITE EXAMPLE
const express = require('express');
const jsonServer = require('json-server');
const router = express.Router();

router.use(jsonServer.rewriter({
	'/goods/search': '/goods/search',
	'/goods/category/:category': '/goods/category/:category',
	'/goods/category/:category/:subCategory': '/goods/category/:category/:subCategory',
	'/goods/item/:id': '/goods/item/:id',
}));

module.exports = router;
