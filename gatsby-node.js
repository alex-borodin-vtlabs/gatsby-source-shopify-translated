"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.sourceNodes = void 0;

var _fp = require("lodash/fp");

var _chalk = _interopRequireDefault(require("chalk"));

var _pIteration = require("p-iteration");

var _lib = require("gatsby-source-shopify/lib");

var _createClient = require("./create-client");

var _lib2 = require("./lib");

var _nodes = require("gatsby-source-shopify/nodes");

var _constants = require("gatsby-source-shopify/constants");

var _queries = require("gatsby-source-shopify/queries");

const sourceNodes = async ({
  actions: {
    createNode,
    touchNode
  },
  createNodeId,
  store,
  cache,
  getCache,
  reporter
}, {
  shopName,
  accessToken,
  apiVersion = `2020-07`,
  verbose = true,
  paginationSize = 250,
  paginationDelay = 500,
  languages = ['en'],
  includeCollections = [_constants.SHOP, _constants.CONTENT],
  shopifyQueries = {}
}) => {
  const createTranslatedClient = locale => (0, _createClient.createClient)(shopName, accessToken, apiVersion, locale);

  const defaultQueries = {
    articles: _queries.ARTICLES_QUERY,
    blogs: _queries.BLOGS_QUERY,
    collections: _queries.COLLECTIONS_QUERY,
    products: _queries.PRODUCTS_QUERY,
    shopPolicies: _queries.SHOP_POLICIES_QUERY,
    shopDetails: _queries.SHOP_DETAILS_QUERY,
    pages: _queries.PAGES_QUERY
  };
  const queries = { ...defaultQueries,
    ...shopifyQueries
  }; // Convenience function to namespace console messages.

  const formatMsg = msg => (0, _chalk.default)`\n{blue gatsby-source-shopify/${shopName}} ${msg}`;

  try {
    console.log(formatMsg(`starting to fetch data from Shopify`)); // Arguments used for file node creation.

    const imageArgs = {
      createNode,
      createNodeId,
      touchNode,
      store,
      cache,
      getCache,
      reporter
    }; // Arguments used for node creation.

    const args = {
      createTranslatedClient,
      createNode,
      createNodeId,
      formatMsg,
      verbose,
      imageArgs,
      paginationSize,
      paginationDelay,
      queries,
      languages
    }; // Message printed when fetching is complete.

    const msg = formatMsg(`finished fetching data from Shopify`);
    let promises = [];

    if (includeCollections.includes(_constants.SHOP)) {
      promises = promises.concat([createNodes(_constants.COLLECTION, queries.collections, _nodes.CollectionNode, args), createNodes(_constants.PRODUCT, queries.products, _nodes.ProductNode, args, async (product, productNode) => {
        if (product.variants) await (0, _pIteration.forEach)(product.variants.edges, async edge => {
          const v = edge.node;
          if (v.metafields) await (0, _pIteration.forEach)(v.metafields.edges, async (edge) => createNode(await (0, _nodes.ProductVariantMetafieldNode)(imageArgs)(edge.node)));
          return createNode(await (0, _nodes.ProductVariantNode)(imageArgs, productNode)(edge.node));
        });
        if (product.metafields) await (0, _pIteration.forEach)(product.metafields.edges, async (edge) => createNode(await (0, _nodes.ProductMetafieldNode)(imageArgs)(edge.node)));
        if (product.options) await (0, _pIteration.forEach)(product.options, async (option) => createNode(await (0, _nodes.ProductOptionNode)(imageArgs)(option)));
      }), createShopPolicies(args), createShopDetails(args)]);
    }

    if (includeCollections.includes(_constants.CONTENT)) {
      promises = promises.concat([createNodes(_constants.BLOG, queries.blogs, _nodes.BlogNode, args), createNodes(_constants.ARTICLE, queries.articles, _nodes.ArticleNode, args, async x => {
        if (x.comments) await (0, _pIteration.forEach)(x.comments.edges, async (edge) => createNode(await (0, _nodes.CommentNode)(imageArgs)(edge.node)));
      }), createPageNodes(_constants.PAGE, queries.pages, _nodes.PageNode, args)]);
    }

    console.time(msg);

    for (const promise of promises) {
      await promise;
    }

    console.timeEnd(msg);
  } catch (e) {
    console.error((0, _chalk.default)`\n{red error} an error occurred while sourcing data`); // If not a GraphQL request error, let Gatsby print the error.

    if (!e.hasOwnProperty(`request`)) throw e;
    (0, _lib.printGraphQLError)(e);
  }
};
/**
 * Fetch and create nodes for the provided endpoint, query, and node factory.
 */


exports.sourceNodes = sourceNodes;

const createNodes = async (endpoint, query, nodeFactory, {
  createTranslatedClient,
  createNode,
  formatMsg,
  verbose,
  imageArgs,
  paginationSize,
  paginationDelay,
  languages
}, f = async () => {}) => {
  // Message printed when fetching is complete.
  const msg = formatMsg(`fetched and processed ${endpoint} nodes`);
  if (verbose) console.time(msg);
  await (0, _pIteration.forEachSeries)(languages, async (locale) => await (0, _pIteration.forEachSeries)(await (0, _lib2.queryAll)(createTranslatedClient(locale), [_constants.NODE_TO_ENDPOINT_MAPPING[endpoint]], query, paginationDelay, paginationSize), async entity => {
    const node = await nodeFactory(imageArgs)(mapEntityIds(entity, locale));
    createNode(node);
    await f(entity, node);
  }));
  if (verbose) console.timeEnd(msg);
};
/**
 * Fetch and create nodes for shop policies.
 */


const createShopDetails = async ({
  createTranslatedClient,
  createNode,
  formatMsg,
  verbose,
  queries,
  languages
}) => {
  // // Message printed when fetching is complete.
  const msg = formatMsg(`fetched and processed ${_constants.SHOP_DETAILS} nodes`);
  if (verbose) console.time(msg);
  await (0, _pIteration.forEach)(languages, async locale => {
    const {
      shop
    } = await (0, _lib.queryOnce)(createTranslatedClient(locale), queries.shopDetails);
    createNode((0, _nodes.ShopDetailsNode)(nodeWithLocale(shop, locale)));
  });
  if (verbose) console.timeEnd(msg);
};
/**
 * Fetch and create nodes for shop policies.
 */


const createShopPolicies = async ({
  createTranslatedClient,
  createNode,
  formatMsg,
  verbose,
  queries,
  languages
}) => {
  // Message printed when fetching is complete.
  const msg = formatMsg(`fetched and processed ${_constants.SHOP_POLICY} nodes`);
  if (verbose) console.time(msg);
  await (0, _pIteration.forEach)(languages, async locale => {
    const {
      shop: policies
    } = await (0, _lib.queryOnce)(createTranslatedClient(locale), queries.shopPolicies);
    Object.entries(policies).filter(([_, policy]) => Boolean(policy)).forEach((0, _fp.pipe)(([type, policy]) => (0, _nodes.ShopPolicyNode)(nodeWithLocale(policy, locale), {
      type
    }), createNode));
  });
  if (verbose) console.timeEnd(msg);
};

const createPageNodes = async (endpoint, query, nodeFactory, {
  createTranslatedClient,
  createNode,
  formatMsg,
  verbose,
  paginationSize,
  paginationDelay,
  languages
}, f = async () => {}) => {
  // Message printed when fetching is complete.
  const msg = formatMsg(`fetched and processed ${endpoint} nodes`);
  if (verbose) console.time(msg);
  await (0, _pIteration.forEach)(languages, async locale => {
    await (0, _pIteration.forEach)(await (0, _lib2.queryAll)(createTranslatedClient(locale), [_constants.NODE_TO_ENDPOINT_MAPPING[endpoint]], query, paginationDelay, paginationSize), async entity => {
      const node = await nodeFactory(entity);
      createNode(nodeWithLocale(node, locale));
      await f(entity);
    });
  });
  if (verbose) console.timeEnd(msg);
};

const nodeWithLocale = (node, locale) => ({ ...node,
  id: `${locale}__${node.id}`,
  locale
});

const mapEntityIds = (node, locale) => {
  if (node.products) {
    node.products.edges.forEach(edge => {
      edge.node = nodeWithLocale(edge.node, locale);
    });
  }

  if (node.variants) {
    node.variants.edges.forEach(edge => {
      edge.node = nodeWithLocale(edge.node, locale);
    });
  }

  if (node.metafields) {
    node.metafields.edges.forEach(edge => {
      edge.node = nodeWithLocale(edge.node, locale);
    });
  }

  if (node.options) {
    node.options = node.options.map(option => nodeWithLocale(option, locale));
  }

  if (node.comments) {
    node.comments.forEach(edge => {
      edge.node = nodeWithLocale(edge.node, locale);
    });
  }

  if (node.image) {
    node.image = nodeWithLocale(node.image, locale);
  }

  if (node.images && node.images.edges) {
    node.images.edges.forEach(edge => {
      edge.node = nodeWithLocale(edge.node, locale);
    });
  }

  return nodeWithLocale(node, locale);
};