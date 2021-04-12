"use strict";

exports.__esModule = true;
exports.queryAll = void 0;

var _lib = require("gatsby-source-shopify/lib");

var _fp = require("lodash/fp");

const timeout = ms => new Promise(resolve => setTimeout(resolve, ms));

const DEFAULT_DELAY = 500;
const DEFAULT_FIRST_OBJECTS = 250;

const queryAll = async (client, path, query, delay = DEFAULT_DELAY, first = DEFAULT_FIRST_OBJECTS, after = null, aggregatedResponse = null) => {
  const t1 = new Date();
  const data = await (0, _lib.queryOnce)(client, query, first, after);
  const t2 = new Date();
  const requestTime = t1.getTime() - t2.getTime();
  console.log(path);
  console.log(`Requested ${requestTime / 1000}`);
  const edges = (0, _fp.getOr)([], [...path, `edges`], data);
  const nodes = edges.map(edge => edge.node);
  aggregatedResponse = aggregatedResponse ? aggregatedResponse.concat(nodes) : nodes;

  if ((0, _fp.get)([...path, `pageInfo`, `hasNextPage`], data)) {
    const tt1 = new Date();
    await timeout(delay);
    const tt2 = new Date();
    const awaitTime = tt1.getTime() - tt2.getTime();
    console.log(`awaited ${awaitTime / 1000}`);
    const returnData = await queryAll(client, path, query, delay, first, (0, _fp.last)(edges).cursor, aggregatedResponse);
    return returnData;
  }

  return aggregatedResponse;
};

exports.queryAll = queryAll;