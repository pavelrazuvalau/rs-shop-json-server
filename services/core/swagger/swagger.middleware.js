const express = require('express');
const router = express.Router();
const path = require('path');

const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerSpec = swaggerJSDoc({
	definition: {
	  openapi: '3.0.0',
	  info: {
		title: 'RS Shop',
		version: '1.0.0',
	  },
	},
	apis: [
        path.join(process.cwd(), 'services/core/**/*.middleware.js')
    ]
  });

module.exports = (server) => {	
    router.use('/swagger', swaggerUi.serveWithOptions({ redirect: false }));
    router.get('/swagger', swaggerUi.setup(swaggerSpec));

	return router;
};