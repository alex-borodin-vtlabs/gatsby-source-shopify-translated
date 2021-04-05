import { queryOnce } from "gatsby-source-shopify/lib"

import { get, getOr, last } from "lodash/fp"

const timeout = ms => new Promise(resolve => setTimeout(resolve, ms));

const DEFAULT_DELAY = 500
const DEFAULT_FIRST_OBJECTS = 250

export const queryAll = async (
    client,
    path,
    query,
    delay = DEFAULT_DELAY,
    first = DEFAULT_FIRST_OBJECTS,
    after = null,
    aggregatedResponse = null
  ) => {
    const data = await queryOnce(client, query, first, after)
    const edges = getOr([], [...path, `edges`], data)
    const nodes = edges.map(edge => edge.node)
  
    aggregatedResponse = aggregatedResponse
      ? aggregatedResponse.concat(nodes)
      : nodes
  
    if (get([...path, `pageInfo`, `hasNextPage`], data)) {
      await timeout(delay)
      return queryAll(
        client,
        path,
        query,
        delay,
        first,
        last(edges).cursor,
        aggregatedResponse
      )
    }
  
    return aggregatedResponse
  }