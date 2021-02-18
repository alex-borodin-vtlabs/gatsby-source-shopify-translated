import { queryOnce } from "gatsby-source-shopify/lib"

import { get, getOr, last } from "lodash/fp"


const timeout = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const queryAll = async (
    client,
    path,
    query,
    first = 250,
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
      await timeout(2000)
      return queryAll(
        client,
        path,
        query,
        first,
        last(edges).cursor,
        aggregatedResponse
      )
    }
  
    return aggregatedResponse
  }