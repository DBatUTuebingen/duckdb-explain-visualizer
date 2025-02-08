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
  "NESTED_LOOP_JOIN": `Joins two datasets by iterating over each row in one dataset and finding matching rows in the other.`,
  "MERGE_JOIN": `Performs a join by first sorting both datasets on the join key and then merging them efficiently.`,
  "HASH_JOIN": `Performs a join by building a hash table on one of the input datasets for fast lookups.`,
  "HASH_GROUP_BY": `Groups records together using a hash table based on a GROUP BY key or aggregate function (e.g., <code>SUM()</code>).`,
  "FILTER": `Filters records based on a specified condition, removing non-matching rows.`,
  "PROJECTION": `Computes expressions and selects specific columns from the input dataset.`,
  "TABLE_SCAN": `Reads all rows from a specified table, performing a sequential scan to retrieve the data.`,
  "INDEX_SCAN": `Uses an index to quickly locate matching rows instead of scanning the entire table.`,
  "INDEX_JOIN": `Uses an index lookup to efficiently join two tables.`,
  "COLUMN_SCAN": `Reads data from the columnar storage format, optimizing access for analytical queries.`,
  "TABLE_FUNCTION": `Executes a table-producing function, often used for reading external data formats.`,
  "UNNEST": `Expands array or list values into multiple rows.`,
  "WINDOW": `Performs window (analytic) function computations over a specified partition of data.`,
  "STREAMING_WINDOW": `Computes window functions by processing rows in a streaming fashion without materializing the entire result set.`,
  "CTE": `(Common Table Expression) is a temporary result set defined within a query that can be referenced multiple times, improving query readability and modularity.`,
  "CTE_SCAN": `Performs a sequential scan over the results of a Common Table Expression (CTE).`,
  "RECURSIVE_CTE": `Defines a Common Table Expression (CTE) that references itself for iterative query processing, enabling recursive operations like tree or graph traversal.`,
  "RECURSIVE_CTE_SCAN": `Iterates over a recursively defined Common Table Expression (CTE), repeatedly executing the recursive query until no new rows are produced.`,
  "CROSS_PRODUCT": `Performs a Cartesian product between two datasets (used when no join condition is specified).`,
  "UNION": `Combines the results of two datasets while removing duplicates.`,
  "UNION_ALL": `Combines the results of two datasets without removing duplicates.`,
  "UNGROUPED_AGGREGATE": `Computes aggregate functions over the entire dataset without a GROUP BY clause.`,
  "READ_CSV_AUTO": `Automatically reads and parses a CSV file, inferring column types and delimiters without explicit user specification.`,
  "DUMMY_SCAN": `Generates a single-row, zero-column result, typically used for queries without an explicit table source (e.g., <code>SELECT 1</code>).`,
  "DELIM_SCAN": `Reads and processes data from a delimiter-separated values (DSV) file, such as <code>CSV</code> or <code>TSV</code>, using a specified delimiter.`,
  "INOUT_FUNCTION": `Represents a function that both takes input arguments and returns output, typically used for user-defined functions (UDFs) in queries.`,
  "RIGHT_DELIM_JOIN": `Performs a join between two datasets based on a delimiter, matching values from the right side of the join condition.`,
  "INSERT": `Represents the operation of adding new rows into a target table by consuming input data from its child node.`,
};

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
  let o: Node | undefined = undefined
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
  NodeProp.FILTER
]

export function shouldShowProp(key: string, value: unknown): boolean {
  return (
    (!!value ||
      nodePropTypes[key] === PropType.increment ||
      key === NodeProp.ACTUAL_ROWS) &&
    notMiscProperties.indexOf(key) === -1
  )
}
