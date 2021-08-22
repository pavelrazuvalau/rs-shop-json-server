const express = require('express');
const router = express.Router();
const url = require('url');

module.exports = server => {
  router.get('/goods', (req, res) => {
    let url_parts = url.parse(req.originalUrl, true),
      query = url_parts.query,
      from = query.start || 0,
      to = +query.start + +query.count,
      goods = server.db.getState().goods;

    if (!!query.textFragment) {
      goods = goods.filter(
        course =>
          course.fullName
            .toUpperCase()
            .indexOf(query.textFragment.toUpperCase()) >= 0
      );
    }

    if (goods.length < to || !to) {
      to = goods.length;
    }
    goods = goods.slice(from, to);

    res.json(goods);
  });

  return router;
};
