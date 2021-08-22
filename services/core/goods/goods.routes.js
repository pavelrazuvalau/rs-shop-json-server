// REWRITE EXAMPLE
const express = require('express');
const jsonServer = require('json-server');
const router = express.Router();

router.use(jsonServer.rewriter({
	'/goods': '/goods',
	'/goods/:id': '/goods/:id',
}));

module.exports = router;
