const express = require('express');
const router = express.Router();
const url = require('url');


/**
  * @swagger
  *
  * tags:
  *   name: categories
  *   description: API for managing categories
  *
  * components:
  *   schemas:
  *     SubCategory:
  *       type: object
  *       properties:
  *         id:
  *           type: string
  *         name:
  *           type: string
  *     Category:
  *       type: object
  *       properties:
  *         id:
  *           type: string
  *         name:
  *           type: string
  *         subCategories:
  *           type: array
  *           items:
  *             $ref: '#/components/schemas/SubCategory'
  * /categories:
  *   get:
  *     tags: [categories]
  *     description: Gets all categories
  *     responses:
  *       200:
  *         content:
  *           application/json:
  *             schema:
  *               type: array
  *               items:
  *                 $ref: '#/components/schemas/Category'
*/
module.exports = (server) => {	
	return router;
};
