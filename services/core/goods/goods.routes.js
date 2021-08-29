// REWRITE EXAMPLE
const express = require('express');
const jsonServer = require('json-server');
const router = express.Router();

router.use(jsonServer.rewriter({
	'/goods/search': '/goods/search',
	'/goods/:category': '/goods/:category',
	'/goods/:category/:subCategory': '/goods/:category/:subCategory',
	'/goods/:category/:subCategory/:id': '/goods/:category/:subCategory/:id',
}));

module.exports = router;
