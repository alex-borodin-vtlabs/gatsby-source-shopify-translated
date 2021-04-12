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
    const t1 = new Date();
    const data= await queryOnce(client, query, first, after)
    const t2 = new Date();
    const requestTime = t1.getTime() - t2.getTime();
    console.log(path)
    console.log(`Requested ${requestTime/1000}`)
    const edges = getOr([], [...path, `edges`], data)
    const nodes = edges.map(edge => edge.node)
  
    aggregatedResponse = aggregatedResponse
      ? aggregatedResponse.concat(nodes)
      : nodes
  
    if (get([...path, `pageInfo`, `hasNextPage`], data)) {
      const tt1 = new Date();      
      await timeout(delay)
      const tt2 = new Date();
      const awaitTime = tt1.getTime() - tt2.getTime();
      console.log(`awaited ${awaitTime/1000}`)
      const returnData = await queryAll(
        client,
        path,
        query,
        delay,
        first,
        last(edges).cursor,
        aggregatedResponse
      )
      return returnData
    }
  
    return aggregatedResponse
  }