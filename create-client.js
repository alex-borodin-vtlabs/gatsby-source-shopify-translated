"use strict";

exports.__esModule = true;
exports.createClient = void 0;

var _graphqlRequest = require("graphql-request");

/**
 * Create a Shopify Storefront GraphQL client for the provided name and token.
 */
const createClient = (shopName, accessToken, apiVersion, language = 'en') => {
  let url;

  if (shopName.includes(`.`)) {
    url = `https://${shopName}/api/${apiVersion}/graphql.json`;
  } else {
    url = `https://${shopName}.myshopify.com/api/${apiVersion}/graphql.json`;
  }

  return new _graphqlRequest.GraphQLClient(url, {
    headers: {
      "X-Shopify-Storefront-Access-Token": accessToken,
      "Accept-Language": language
    }
  });
};

exports.createClient = createClient;