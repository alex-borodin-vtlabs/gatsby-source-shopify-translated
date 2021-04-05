"use strict";

exports.__esModule = true;
exports.queryAll = void 0;

var _lib = require("gatsby-source-shopify/lib");

var _fp = require("lodash/fp");

const timeout = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const queryAll = async (client, path, query, delay = 500, first = 250, after = null, aggregatedResponse = null) => {
  console.log(path);
  const data = await (0, _lib.queryOnce)(client, query, first, after);
  const edges = (0, _fp.getOr)([], [...path, `edges`], data);
  const nodes = edges.map(edge => edge.node);
  aggregatedResponse = aggregatedResponse ? aggregatedResponse.concat(nodes) : nodes;

  if ((0, _fp.get)([...path, `pageInfo`, `hasNextPage`], data)) {
    await timeout(delay);
    return queryAll(client, path, query, delay, first, (0, _fp.last)(edges).cursor, aggregatedResponse);
  }

  return aggregatedResponse;
};

exports.queryAll = queryAll;