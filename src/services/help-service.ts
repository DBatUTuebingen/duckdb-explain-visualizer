import _ from "lodash"
import type { IPlan, Node } from "@/interfaces"
import { NodeProp } from "@/enums"
import { nodePropTypes, PropType } from "@/enums"

export class HelpService {
  public nodeId = 0

  public getNodeTypeDescription(nodeType: string) {
    return NODE_DESCRIPTIONS[nodeType.toUpperCase()]
  }

  public getHelpMessage(helpMessage: string) {
    return HELP_MESSAGES[helpMessage.toUpperCase()]
  }
}

interface INodeDescription {
  [key: string]: string
}

export const NODE_DESCRIPTIONS: INodeDescription = {
  NESTED_LOOP_JOIN: `Joins two tables using a nested loop.`,
  MERGE_JOIN: `Performs a join by first sorting both tables on the join key and then merging them efficiently.`,
  HASH_JOIN: `Performs a join by building a hash table on one of the input tables for fast lookups.`,
  HASH_GROUP_BY: `Is a group-by and aggregate implementation that uses a hash table to perform the grouping.`,
  FILTER: `It removes non-matching tuples from the result. Note that it does not physically change the data, it only adds a selection vector to the chunk.`,
  PROJECTION: `Computes expressions and selects specific columns from the input dataset.`,
  TABLE_SCAN: `Reads rows from a base table.`,
  // "INDEX_SCAN": `Uses an index to quickly locate matching rows instead of scanning the entire table.`,
  // "INDEX_JOIN": `Uses an index lookup to efficiently join two tables.`,
  // "COLUMN_SCAN": `Reads data from the columnar storage format, optimizing access for analytical queries.`,
  // "TABLE_FUNCTION": `Executes a table-producing function, often used for reading external data formats.`,
  UNNEST: `Unnests an array or stuct into a table.`,
  WINDOW: `Performs window function computations over a specified partition of data.`,
  STREAMING_WINDOW: `Computes window functions in a streaming fashion without materializing the entire result set.`,
  CTE: `Materialized CTEs hold a temporary table defined within the scope of a query that can be referenced multiple times.`,
  CTE_SCAN: `Scans the <code>result table</code> of a materialized CTE.`,
  RECURSIVE_CTE: `Defines a recursive Common Table Expression (CTE) that enables iterative query processing.`,
  RECURSIVE_CTE_SCAN: `Scans the <code>working table</code> of a <code>RECURSIVE_CTE</code>.`,
  CROSS_PRODUCT: `Performs a Cartesian product between two tables.`,
  UNION: `Combines the results of two tables.`,
  UNGROUPED_AGGREGATE: `Computes aggregate functions over the entire input table without grouping.`,
  READ_CSV_AUTO: `Reads and parses CSV files, inferring column types and delimiters without explicit user specification.`,
  DUMMY_SCAN: `Generates a single-row, zero-column result, typically used for queries without an explicit table source (e.g., <code>SELECT 1</code>).`,
  DELIM_SCAN: `A <code>DELIM_SCAN</code> works in conjunction with a <code>DELIM_JOIN</code> and reads the set of correlated values.`,
  INOUT_FUNCTION: `Represents a table in-out function that can accepts a table as input and returns a table.`,
  RIGHT_DELIM_JOIN: `A <code>DELIM_JOIN</code> is used when DuckDB detects (and eliminates) a correlated subquery.`,
  LEFT_DELIM_JOIN: `A <code>DELIM_JOIN</code> is used when DuckDB detects (and eliminates) a correlated subquery.`,
  INSERT: `Inserts new rows into a table by consuming input data from its child node.`,
  UPDATE: `Updates rows in a table.`,
  DELETE: `Deletes rows of a table.`,
}

interface IHelpMessage {
  [key: string]: string
}

export const HELP_MESSAGES: IHelpMessage = {
  "MISSING EXECUTION TIME": `Execution time (or Total runtime) not available for this plan. Make sure you
    use ANALYZE.`,
  "MISSING BLOCKED THREAD TIME": `Blocked thread time not available for this plan. Make sure you
    use ANALYZE.`,
  "MISSING LATENCY": `Latency not available for this plan. Make sure you
    use ANALYZE.`,
  "MISSING ROWS RETURNED": `Rows returned not available for this plan. Make sure you
    use ANALYZE.`,
  "MISSING RESULT SIZE": `Result size not available for this plan. Make sure you
    use ANALYZE.`,
}

interface EaseInOutQuadOptions {
  currentTime: number
  start: number
  change: number
  duration: number
}

export function scrollChildIntoParentView(
  parent: Element,
  child: Element,
  shouldCenter: boolean,
  done?: () => void
) {
  if (!child) {
    return
  }
  // Where is the parent on page
  const parentRect = parent.getBoundingClientRect()
  // Where is the child
  const childRect = child.getBoundingClientRect()

  let scrollLeft = parent.scrollLeft // don't move
  const isChildViewableX =
    childRect.left >= parentRect.left &&
    childRect.left <= parentRect.right &&
    childRect.right <= parentRect.right

  let scrollTop = parent.scrollTop
  const isChildViewableY =
    childRect.top >= parentRect.top &&
    childRect.top <= parentRect.bottom &&
    childRect.bottom <= parentRect.bottom

  if (shouldCenter || !isChildViewableX || !isChildViewableY) {
    // scroll by offset relative to parent
    // try to put the child in the middle of parent horizontaly
    scrollLeft =
      childRect.left +
      parent.scrollLeft -
      parentRect.left -
      parentRect.width / 2 +
      childRect.width / 2
    scrollTop =
      childRect.top +
      parent.scrollTop -
      parentRect.top -
      parentRect.height / 2 +
      childRect.height / 2
    smoothScroll({
      element: parent,
      to: { scrollTop, scrollLeft },
      duration: 400,
      done,
    })
  } else if (done) {
    done()
  }
}

const easeInOutQuad = ({
  currentTime,
  start,
  change,
  duration,
}: EaseInOutQuadOptions) => {
  let newCurrentTime = currentTime
  newCurrentTime /= duration / 2

  if (newCurrentTime < 1) {
    return (change / 2) * newCurrentTime * newCurrentTime + start
  }

  newCurrentTime -= 1
  return (-change / 2) * (newCurrentTime * (newCurrentTime - 2) - 1) + start
}

interface SmoothScrollOptions {
  duration: number
  element: Element
  to: {
    scrollTop: number
    scrollLeft: number
  }
  done?: () => void
}

export function smoothScroll({
  duration,
  element,
  to,
  done,
}: SmoothScrollOptions) {
  const startX = element.scrollTop
  const startY = element.scrollLeft
  const changeX = to.scrollTop - startX
  const changeY = to.scrollLeft - startY
  const startDate = new Date().getTime()

  const animateScroll = () => {
    const currentDate = new Date().getTime()
    const currentTime = currentDate - startDate
    element.scrollTop = easeInOutQuad({
      currentTime,
      start: startX,
      change: changeX,
      duration,
    })
    element.scrollLeft = easeInOutQuad({
      currentTime,
      start: startY,
      change: changeY,
      duration,
    })

    if (currentTime < duration) {
      requestAnimationFrame(animateScroll)
    } else {
      element.scrollTop = to.scrollTop
      element.scrollLeft = to.scrollLeft
      if (done) {
        done()
      }
    }
  }
  animateScroll()
}

/*
 * Split a string, ensuring balanced parenthesis and balanced quotes.
 */
export function splitBalanced(input: string, split: string) {
  // Build the pattern from params with defaults:
  const pattern = "([\\s\\S]*?)(e)?(?:(o)|(c)|(t)|(sp)|$)"
    .replace("sp", split)
    .replace("o", "[\\(\\{\\[]")
    .replace("c", "[\\)\\}\\]]")
    .replace("t", "['\"]")
    .replace("e", "[\\\\]")
  const r = new RegExp(pattern, "gi")
  const stack: string[] = []
  let buffer: string[] = []
  const results: string[] = []
  input.replace(r, ($0, $1, $e, $o, $c, $t, $s) => {
    if ($e) {
      // Escape
      buffer.push($1, $s || $o || $c || $t)
      return ""
    } else if ($o) {
      // Open
      stack.push($o)
    } else if ($c) {
      // Close
      stack.pop()
    } else if ($t) {
      // Toggle
      if (stack[stack.length - 1] !== $t) {
        stack.push($t)
      } else {
        stack.pop()
      }
    } else {
      // Split (if no stack) or EOF
      if ($s ? !stack.length : !$1) {
        buffer.push($1)
        results.push(buffer.join(""))
        buffer = []
        return ""
      }
    }
    buffer.push($0)
    return ""
  })
  return results
}

export function findNodeById(plan: IPlan, id: number): Node | undefined {
  let o: Node | undefined = undefined
  const root = plan.content[NodeProp.PLANS][0] as Node
  if (root.nodeId == id) {
    return root
  }
  if (root && root[NodeProp.PLANS]) {
    root[NodeProp.PLANS]?.some(function iter(child: Node): boolean | undefined {
      if (child.nodeId === id) {
        o = child
        return true
      }
      return child[NodeProp.PLANS] && child[NodeProp.PLANS].some(iter)
    })
  }
  return o
}

export function findNodeBySubplanName(
  plan: IPlan,
  subplanName: string
): Node | undefined {
  const o: Node | undefined = undefined
  return o
}

// Returns the list of properties that have already been displayed either in
// the main panel or in other detailed tabs.
const notMiscProperties: string[] = [
  NodeProp.NODE_TYPE,
  NodeProp.NODE_TYPE_EXPLAIN,
  NodeProp.EXTRA_INFO,
  NodeProp.ACTUAL_TIME,
  NodeProp.ACTUAL_ROWS,
  NodeProp.OPERATOR_ROWS_SCANNED,
  NodeProp.ESTIMATED_ROWS,
  NodeProp.CTE_NAME,
  NodeProp.JOIN_TYPE,
  NodeProp.NODE_ID,
  "size", // Manually added to use FlexTree
  NodeProp.RELATION_NAME,
  NodeProp.FUNCTION_NAME,
  NodeProp.PROJECTIONS,
  NodeProp.CONDITIONS,
  NodeProp.FILTER,
]

export function shouldShowProp(key: string, value: unknown): boolean {
  return (
    (!!value ||
      nodePropTypes[key] === PropType.increment ||
      key === NodeProp.ACTUAL_ROWS) &&
    notMiscProperties.indexOf(key) === -1
  )
}
