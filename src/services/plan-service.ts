import _ from "lodash"
import {
  BufferLocation,
  EstimateDirection,
  SortGroupsProp,
  NodeProp,
  SortSpaceMemoryProp,
  WorkerProp,
} from "@/enums"
import { splitBalanced } from "@/services/help-service"
import type {
  IBlocksStats,
  IPlan,
  IPlanContent,
  IPlanStats,
  JIT,
  SortGroups,
} from "@/interfaces"
import { Node, Worker } from "@/interfaces"
import clarinet from "clarinet"

interface NodeElement {
  node: Node
  subelementType?: string
  name?: string
}

interface JitElement {
  node: object
}

export class PlanService {
  private static instance: PlanService
  private nodeId = 0

  public createPlan(
    planName: string,
    planContent: IPlanContent,
    planQuery: string
  ): IPlan {
    // remove any extra white spaces in the middle of query
    // (\S) start match after any non-whitespace character => group 1
    // (?!$) don't start match after end of line
    // (\s{2,}) group of 2 or more white spaces
    // '$1 ' reuse group 1 and and a single space
    planQuery = planQuery.replace(/(\S)(?!$)(\s{2,})/gm, "$1 ")

    if (!planContent.children[0]) {
      throw new Error("Invalid plan")
    }

    const plan: IPlan = {
      id: NodeProp.PEV_PLAN_TAG + new Date().getTime().toString(),
      name: planName || "plan created on " + new Date().toDateString(),
      createdOn: new Date(),
      content: planContent.children[0],
      query: planQuery,
      planStats: {} as IPlanStats,
    }

    this.nodeId = 1
    this.processNode(planContent.children[0], plan)
    this.calculateMaximums(plan)
    this.calculateExecutionTime(plan)
    return plan
  }

  // recursively walk down the plan to compute various metrics
  public processNode(node: Node, plan: IPlan) {
    node.nodeId = this.nodeId++

    _.each(node[NodeProp.PLANS], (child) => {
      this.processNode(child, plan)
    })
  }

  public calculateMaximums(plan: IPlan) {
    type recurseItemType = Array<[Node, recurseItemType]>

    function recurse(nodes: Node[]): recurseItemType {
      return _.map(nodes, (node) => [node, recurse(node[NodeProp.PLANS])])
    }

    let flat: Node[] = []
    flat = flat.concat(_.flattenDeep(recurse([plan.content as Node])))
    _.each(plan.ctes, (cte) => {
      flat = flat.concat(_.flattenDeep(recurse([cte as Node])))
    })

    const largest = _.maxBy(flat, NodeProp.ACTUAL_ROWS)
    if (largest) {
      plan.content.maxRows = largest[NodeProp.ACTUAL_ROWS] as number
    }

    const largestScanned = _.maxBy(flat, NodeProp.OPERATOR_ROWS_SCANNED)
    if (largestScanned) {
      plan.content.maxRowsScanned = largestScanned[
        NodeProp.OPERATOR_ROWS_SCANNED
      ] as number
    }

    const largestResult = _.maxBy(flat, NodeProp.RESULT_SET_SIZE)
    if (largestResult) {
      plan.content.maxResult = largestResult[NodeProp.RESULT_SET_SIZE] as number
    }

    const largestEstimate = _.maxBy(flat, function (node) {
      const cardinality: number =
        node[NodeProp.EXTRA_INFO][NodeProp.ESTIMATED_ROWS]
      if (cardinality != null) {
        return cardinality
      } else {
        return 0
      }
    })
    if (largestEstimate) {
      plan.content.maxEstimatedRows = parseInt(
        largestEstimate[NodeProp.EXTRA_INFO][NodeProp.ESTIMATED_ROWS]
      ) as number
    }

    const slowest = _.maxBy(flat, NodeProp.ACTUAL_TIME)
    if (slowest) {
      plan.content.maxDuration = slowest[NodeProp.ACTUAL_TIME] as number
    }
  }

  public calculateExecutionTime(plan: IPlan) {
    // TODO: implement
  }

  public cleanupSource(source: string) {
    // Remove frames around, handles |, ║,
    source = source.replace(/^(\||║|│)(.*)\1\r?\n/gm, "$2\n")
    // Remove frames at the end of line, handles |, ║,
    source = source.replace(/(.*)(\||║|│)$\r?\n/gm, "$1\n")

    // Remove separator lines from various types of borders
    source = source.replace(/^\+-+\+\r?\n/gm, "")
    source = source.replace(/^(-|─|═)\1+\r?\n/gm, "")
    source = source.replace(/^(├|╟|╠|╞)(─|═)\2*(┤|╢|╣|╡)\r?\n/gm, "")

    // Remove more horizontal lines
    source = source.replace(/^\+-+\+\r?\n/gm, "")
    source = source.replace(/^└(─)+┘\r?\n/gm, "")
    source = source.replace(/^╚(═)+╝\r?\n/gm, "")
    source = source.replace(/^┌(─)+┐\r?\n/gm, "")
    source = source.replace(/^╔(═)+╗\r?\n/gm, "")

    // Remove quotes around lines, both ' and "
    source = source.replace(/^(["'])(.*)\1\r?/gm, "$2")

    // Remove "+" line continuations
    source = source.replace(/\s*\+\r?\n/g, "\n")

    // Remove "↵" line continuations
    source = source.replace(/↵\r?/gm, "\n")

    // Remove "query plan" header
    source = source.replace(/^\s*QUERY PLAN\s*\r?\n/m, "")

    // Remove rowcount
    // example: (8 rows)
    // Note: can be translated
    // example: (8 lignes)
    source = source.replace(/^\(\d+\s+[a-z]*s?\)(\r?\n|$)/gm, "\n")

    return source
  }

  public fromSource(source: string) {
    source = this.cleanupSource(source)

    let isJson = false
    try {
      isJson = JSON.parse(source)
    } catch (error) {
      // continue
    }

    if (isJson) {
      return this.parseJson(source)
    } else if (/^(\s*)(\[|\{)\s*\n.*?\1(\]|\})\s*/gms.exec(source)) {
      return this.fromJson(source)
    }
    return this.fromText(source)
  }

  public fromJson(source: string) {
    // We need to remove things before and/or after explain
    // To do this, first - split explain into lines...
    const sourceLines = source.split(/[\r\n]+/)

    // Now, find first line of explain, and cache it's prefix (some spaces ...)
    let prefix = ""
    let firstLineIndex = 0
    _.each(sourceLines, (l: string, index: number) => {
      const matches = /^(\s*)(\[|\{)\s*$/.exec(l)
      if (matches) {
        prefix = matches[1]
        firstLineIndex = index
        return false
      }
    })
    // now find last line
    let lastLineIndex = 0
    _.each(sourceLines, (l: string, index: number) => {
      const matches = new RegExp("^" + prefix + "(]|})s*$").exec(l)
      if (matches) {
        lastLineIndex = index
        return false
      }
    })

    const useSource: string = sourceLines
      .slice(firstLineIndex, lastLineIndex + 1)
      .join("\n")
      // Replace two double quotes (added by pgAdmin)
      .replace(/""/gm, '"')

    return this.parseJson(useSource)
  }

  // Stream parse JSON as it can contain duplicate keys (workers)
  public parseJson(source: string) {
    const parser = clarinet.parser()
    type JsonElement = { [key: string]: JsonElement | null }
    const elements: (JsonElement | never[])[] = []
    let root: JsonElement | JsonElement[] | null = null
    // Store the level and duplicated object|array
    let duplicated: [number, JsonElement | null] | null = null
    parser.onvalue = (v: JsonElement) => {
      const current = elements[elements.length - 1] as JsonElement
      if (_.isArray(current)) {
        current.push(v)
      } else {
        const keys = Object.keys(current)
        const lastKey = keys[keys.length - 1]
        current[lastKey] = v
      }
    }
    parser.onopenobject = (key: string) => {
      const o: JsonElement = {}
      o[key] = null
      elements.push(o)
    }
    parser.onkey = (key: string) => {
      const current = elements[elements.length - 1] as JsonElement
      const keys = Object.keys(current)
      if (keys.indexOf(key) !== -1) {
        duplicated = [elements.length - 1, current[key]]
      } else {
        current[key] = null
      }
    }
    parser.onopenarray = () => {
      elements.push([])
    }
    parser.oncloseobject = parser.onclosearray = () => {
      const popped = elements.pop() as JsonElement

      if (!elements.length) {
        root = popped
      } else {
        const current = elements[elements.length - 1] as JsonElement

        if (duplicated && duplicated[0] === elements.length - 1) {
          _.merge(duplicated[1], popped)
          duplicated = null
        } else {
          if (_.isArray(current)) {
            current.push(popped)
          } else {
            const keys = Object.keys(current)
            const lastKey = keys[keys.length - 1]
            current[lastKey] = popped
          }
        }
      }
    }
    parser.write(source).close()
    if (Array.isArray(root)) {
      root = root[0]
    }
    return root
  }

  public splitIntoLines(text: string): string[] {
    // Splits source into lines, while fixing (well, trying to fix)
    // cases where input has been force-wrapped to some length.
    const out: string[] = []
    const lines = text.split(/\r?\n/)
    const countChar = (str: string, ch: RegExp) => (str.match(ch) || []).length
    const closingFirst = (str: string) => {
      const closingParIndex = str.indexOf(")")
      const openingParIndex = str.indexOf("(")
      return closingParIndex != -1 && closingParIndex < openingParIndex
    }

    const sameIndent = (line1: string, line2: string) => {
      return line1.search(/\S/) == line2.search(/\S/)
    }

    _.each(lines, (line: string) => {
      if (countChar(line, /\)/g) > countChar(line, /\(/g)) {
        // if there more closing parenthesis this means that it's the
        // continuation of a previous line
        out[out.length - 1] += line
      } else if (
        line.match(
          /^(?:Total\s+runtime|Planning\s+time|Execution\s+time|Time|Filter|Output|JIT)/i
        )
      ) {
        out.push(line)
      } else if (
        line.match(/^\S/) || // doesn't start with a blank space (allowed only for the first node)
        line.match(/^\s*\(/) || // first non-blank character is an opening parenthesis
        closingFirst(line) // closing parenthesis before opening one
      ) {
        if (0 < out.length) {
          out[out.length - 1] += line
        } else {
          out.push(line)
        }
      } else if (
        0 < out.length &&
        out[out.length - 1].match(/^\s*Output/i) &&
        !sameIndent(out[out.length - 1], line)
      ) {
        // If previous line was Output and current line is not same indent
        // (which would mean a new information line)
        out[out.length - 1] += line
      } else {
        out.push(line)
      }
    })
    return out
  }

  public fromText(text: string) {
    const lines = this.splitIntoLines(text)

    const root: IPlanContent = {} as IPlanContent
    type ElementAtDepth = [number, NodeElement | JitElement]
    // Array to keep reference to previous nodes with there depth
    const elementsAtDepth: ElementAtDepth[] = []

    _.each(lines, (line: string) => {
      // Remove any trailing "
      line = line.replace(/"\s*$/, "")
      // Remove any begining "
      line = line.replace(/^\s*"/, "")
      // Replace tabs with 4 spaces
      line = line.replace(/\t/gm, "    ")

      const indentationRegex = /^\s*/
      const match = line.match(indentationRegex)
      const depth = match ? match[0].length : 0
      // remove indentation
      line = line.replace(indentationRegex, "")

      const emptyLineRegex = "^s*$"
      const headerRegex = "^\\s*(QUERY|---|#).*$"
      const prefixRegex = "^(\\s*->\\s*|\\s*)"
      const typeRegex = "([^\\r\\n\\t\\f\\v\\:\\(]*?)"
      // tslint:disable-next-line:max-line-length
      const estimationRegex =
        "\\(cost=(\\d+\\.\\d+)\\.\\.(\\d+\\.\\d+)\\s+rows=(\\d+)\\s+width=(\\d+)\\)"
      const nonCapturingGroupOpen = "(?:"
      const nonCapturingGroupClose = ")"
      const openParenthesisRegex = "\\("
      const closeParenthesisRegex = "\\)"
      // tslint:disable-next-line:max-line-length
      const actualRegex =
        "(?:actual\\stime=(\\d+\\.\\d+)\\.\\.(\\d+\\.\\d+)\\srows=(\\d+)\\sloops=(\\d+)|actual\\srows=(\\d+)\\sloops=(\\d+)|(never\\s+executed))"
      const optionalGroup = "?"

      const emptyLineMatches = new RegExp(emptyLineRegex).exec(line)
      const headerMatches = new RegExp(headerRegex).exec(line)

      /*
       * Groups
       * 1: prefix
       * 2: type
       * 3: estimated_startup_cost
       * 4: estimated_total_cost
       * 5: estimated_rows
       * 6: estimated_row_width
       * 7: actual_time_first
       * 8: actual_time_last
       * 9: actual_rows
       * 10: actual_loops
       * 11: actual_rows_
       * 12: actual_loops_
       * 13: never_executed
       * 14: estimated_startup_cost
       * 15: estimated_total_cost
       * 16: estimated_rows
       * 17: estimated_row_width
       * 18: actual_time_first
       * 19: actual_time_last
       * 20: actual_rows
       * 21: actual_loops
       */
      const nodeRegex = new RegExp(
        prefixRegex +
          typeRegex +
          "\\s*" +
          nonCapturingGroupOpen +
          (nonCapturingGroupOpen +
            estimationRegex +
            "\\s+" +
            openParenthesisRegex +
            actualRegex +
            closeParenthesisRegex +
            nonCapturingGroupClose) +
          "|" +
          nonCapturingGroupOpen +
          estimationRegex +
          nonCapturingGroupClose +
          "|" +
          nonCapturingGroupOpen +
          openParenthesisRegex +
          actualRegex +
          closeParenthesisRegex +
          nonCapturingGroupClose +
          nonCapturingGroupClose +
          "\\s*$",
        "gm"
      )
      const nodeMatches = nodeRegex.exec(line)

      // tslint:disable-next-line:max-line-length
      const subRegex =
        /^(\s*)((?:Sub|Init)Plan)\s*(?:\d+\s*)?\s*(?:\(returns.*\)\s*)?$/gm
      const subMatches = subRegex.exec(line)

      const cteRegex = /^(\s*)CTE\s+(\S+)\s*$/g
      const cteMatches = cteRegex.exec(line)
      /*
       * Groups
       * 2: Worker number
       * 3: actual_time_first
       * 4: actual_time_last
       * 5: actual_rows
       * 6: actual_loops
       * 7: actual_rows_
       * 8: actual_loops_
       * 9: never_executed
       * 10: extra
       */
      const extraRegex = /^(\s*)(\S.*\S)\s*$/g
      const extraMatches = extraRegex.exec(line)

      if (emptyLineMatches || headerMatches) {
        return
      } else if (nodeMatches && !cteMatches && !subMatches) {
        //const prefix = nodeMatches[1]
        const neverExecuted = nodeMatches[13]
        const newNode: Node = new Node(nodeMatches[2])
        if (
          (nodeMatches[3] && nodeMatches[4]) ||
          (nodeMatches[14] && nodeMatches[15])
        ) {
          newNode[NodeProp.STARTUP_COST] = parseFloat(
            nodeMatches[3] || nodeMatches[14]
          )
          newNode[NodeProp.TOTAL_COST] = parseFloat(
            nodeMatches[4] || nodeMatches[15]
          )
          newNode[NodeProp.PLAN_ROWS] = parseInt(
            nodeMatches[5] || nodeMatches[16],
            0
          )
          newNode[NodeProp.PLAN_WIDTH] = parseInt(
            nodeMatches[6] || nodeMatches[17],
            0
          )
        }
        if (
          (nodeMatches[7] && nodeMatches[8]) ||
          (nodeMatches[18] && nodeMatches[19])
        ) {
          newNode[NodeProp.ACTUAL_STARTUP_TIME] = parseFloat(
            nodeMatches[7] || nodeMatches[18]
          )
          newNode[NodeProp.ACTUAL_TIME] = parseFloat(
            nodeMatches[8] || nodeMatches[19]
          )
        }

        if (
          (nodeMatches[9] && nodeMatches[10]) ||
          (nodeMatches[11] && nodeMatches[12]) ||
          (nodeMatches[20] && nodeMatches[21])
        ) {
          newNode[NodeProp.ACTUAL_ROWS] = parseInt(
            nodeMatches[9] || nodeMatches[11] || nodeMatches[20],
            0
          )
          newNode[NodeProp.ACTUAL_LOOPS] = parseInt(
            nodeMatches[10] || nodeMatches[12] || nodeMatches[21],
            0
          )
        }

        if (neverExecuted) {
          newNode[NodeProp.ACTUAL_LOOPS] = 0
          newNode[NodeProp.ACTUAL_ROWS] = 0
          newNode[NodeProp.ACTUAL_TIME] = 0
        }
        const element = {
          node: newNode,
          subelementType: "subnode",
        }

        if (0 === elementsAtDepth.length) {
          elementsAtDepth.push([depth, element])
          root.Plan = newNode
          return
        }

        // Remove elements from elementsAtDepth for deeper levels
        _.remove(elementsAtDepth, (e) => {
          return e[0] >= depth
        })

        // ! is for non-null assertion
        // Prevents the "Object is possibly 'undefined'" linting error
        const previousElement = _.last(elementsAtDepth)?.[1] as NodeElement

        if (!previousElement) {
          return
        }

        elementsAtDepth.push([depth, element])

        if (!previousElement.node[NodeProp.PLANS]) {
          previousElement.node[NodeProp.PLANS] = []
        }
        if (previousElement.subelementType === "initplan") {
          newNode[NodeProp.PARENT_RELATIONSHIP] = "InitPlan"
          newNode[NodeProp.SUBPLAN_NAME] = previousElement.name as string
        } else if (previousElement.subelementType === "subplan") {
          newNode[NodeProp.PARENT_RELATIONSHIP] = "SubPlan"
          newNode[NodeProp.SUBPLAN_NAME] = previousElement.name as string
        }
        previousElement.node.Plans?.push(newNode)
      } else if (subMatches) {
        //const prefix = subMatches[1]
        const type = subMatches[2]
        // Remove elements from elementsAtDepth for deeper levels
        _.remove(elementsAtDepth, (e) => e[0] >= depth)
        const previousElement = _.last(elementsAtDepth)?.[1]
        const element = {
          node: previousElement?.node as Node,
          subelementType: type.toLowerCase(),
          name: subMatches[0],
        }
        elementsAtDepth.push([depth, element])
      } else if (cteMatches) {
        //const prefix = cteMatches[1]
        const cteName = cteMatches[2]
        // Remove elements from elementsAtDepth for deeper levels
        _.remove(elementsAtDepth, (e) => e[0] >= depth)
        const previousElement = _.last(elementsAtDepth)?.[1]
        const element = {
          node: previousElement?.node as Node,
          subelementType: "initplan",
          name: "CTE " + cteName,
        }
        elementsAtDepth.push([depth, element])
      } else if (extraMatches) {
        //const prefix = extraMatches[1]

        // Remove elements from elementsAtDepth for deeper levels
        // Depth == 1 is a special case here. Global info (for example
        // execution|planning time) have a depth of 1 but shouldn't be removed
        // in case first node was at depth 0.
        _.remove(elementsAtDepth, (e) => e[0] >= depth || depth == 1)

        let element
        if (elementsAtDepth.length === 0) {
          element = root
        } else {
          element = _.last(elementsAtDepth)?.[1].node as Node
        }

        // if no node have been found yet and a 'Query Text' has been found
        // there the line is the part of the query
        if (!element.Plan && element["Query Text"]) {
          element["Query Text"] += "\n" + line
          return
        }

        const info = extraMatches[2].split(/: (.+)/).filter((x) => x)
        if (!info[1]) {
          return
        }

        if (!element) {
          return
        }

        if (this.parseSort(extraMatches[2], element as Node)) {
          return
        }

        if (this.parseTiming(extraMatches[2], element as Node)) {
          return
        }

        if (this.parseSortGroups(extraMatches[2], element as Node)) {
          return
        }

        if (this.parseSortKey(extraMatches[2], element as Node)) {
          return
        }

        // remove the " ms" unit in case of time
        let value: string | number = info[1].replace(/(\s*ms)$/, "")
        // try to convert to number
        if (parseFloat(value)) {
          value = parseFloat(value)
        }

        let property = info[0]
        if (
          property.indexOf(" runtime") !== -1 ||
          property.indexOf(" time") !== -1
        ) {
          property = _.startCase(property)
        }
        element[property] = value
      }
    })
    if (root == null || !root.Plan) {
      throw new Error("Unable to parse plan")
    }
    return root
  }

  private parseSortKey(text: string, el: Node): boolean {
    const sortRegex = /^\s*((?:Sort|Presorted) Key):\s+(.*)/g
    const sortMatches = sortRegex.exec(text)
    if (sortMatches) {
      el[sortMatches[1]] = _.map(splitBalanced(sortMatches[2], ","), _.trim)
      return true
    }
    return false
  }

  private parseSort(text: string, el: Node | Worker): boolean {
    /*
     * Groups
     * 2: Sort Method
     * 3: Sort Space Type
     * 4: Sort Space Used
     */
    const sortRegex =
      /^(\s*)Sort Method:\s+(.*)\s+(Memory|Disk):\s+(?:(\S*)kB)\s*$/g
    const sortMatches = sortRegex.exec(text)
    if (sortMatches) {
      el[NodeProp.SORT_METHOD] = sortMatches[2].trim()
      el[NodeProp.SORT_SPACE_USED] = sortMatches[4]
      el[NodeProp.SORT_SPACE_TYPE] = sortMatches[3]
      return true
    }
    return false
  }

  private parseTiming(text: string, el: Node): boolean {
    // Parses a timing block in JIT block
    // eg. Timing: Generation 0.340 ms, Inlining 0.000 ms, Optimization 0.168 ms, Emission 1.907 ms, Total 2.414 ms

    /*
     * Groups
     */
    const timingRegex = /^(\s*)Timing:\s+(.*)$/g
    const timingMatches = timingRegex.exec(text)

    if (timingMatches) {
      el.Timing = {}
      const timings = timingMatches[2].split(/\s*,\s*/)
      let matches
      _.each(timings, (option) => {
        const reg = /^(\S*)\s+(.*)$/g
        matches = reg.exec(option)
        if (matches && el.Timing) {
          el.Timing[matches[1]] = this.parseTime(matches[2])
        }
      })
      return true
    }
    return false
  }

  private parseTime(text: string): number {
    return parseFloat(text.replace(/(\s*ms)$/, ""))
  }

  private parseSortGroups(text: string, el: Node): boolean {
    // Parses a Full-sort Groups block
    // eg. Full-sort Groups: 312500  Sort Method: quicksort  Average Memory: 26kB  Peak Memory: 26kB
    const sortGroupsRegex =
      /^\s*(Full-sort|Pre-sorted) Groups:\s+([0-9]*)\s+Sort Method[s]*:\s+(.*)\s+Average Memory:\s+(\S*)kB\s+Peak Memory:\s+(\S*)kB.*$/g
    const matches = sortGroupsRegex.exec(text)

    if (matches) {
      const groups: SortGroups = {
        [SortGroupsProp.GROUP_COUNT]: parseInt(matches[2], 0),
        [SortGroupsProp.SORT_METHODS_USED]: _.map(
          matches[3].split(","),
          _.trim
        ),
        [SortGroupsProp.SORT_SPACE_MEMORY]: {
          [SortSpaceMemoryProp.AVERAGE_SORT_SPACE_USED]: parseInt(
            matches[4],
            0
          ),
          [SortSpaceMemoryProp.PEAK_SORT_SPACE_USED]: parseInt(matches[5], 0),
        },
      }

      if (matches[1] === "Full-sort") {
        el[NodeProp.FULL_SORT_GROUPS] = groups
      } else if (matches[1] === "Pre-sorted") {
        el[NodeProp.PRE_SORTED_GROUPS] = groups
      } else {
        throw new Error("Unsupported sort groups method")
      }
      return true
    }
    return false
  }
}
