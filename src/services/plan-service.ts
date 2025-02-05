import _ from "lodash"
import { NodeProp } from "@/enums"
import type { IPlan, IPlanContent, IPlanStats } from "@/interfaces"
import type { Node } from "@/interfaces"
import clarinet from "clarinet"

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

    if (planContent[NodeProp.PLANS][0] !== undefined) {
      const plan: IPlan = {
        id: NodeProp.DEV_PLAN_TAG + new Date().getTime().toString(),
        name: planName || "plan created on " + new Date().toDateString(),
        createdOn: new Date(),
        content: planContent,
        query: planQuery,
        planStats: {} as IPlanStats,
      }
      this.nodeId = 1
      // console.log(planContent)
      if (planContent[NodeProp.CPU_TIME] !== undefined) {
        // plan is analyzed
        this.processNode(planContent[NodeProp.PLANS]![0]!, plan)
      } else {
        // plan is not analyzed
        this.processNode(planContent as unknown as Node, plan)
      }
      this.calculateMaximums(plan)
      this.calculateExecutionTime(plan)
      return plan
    } else {
      throw new Error("Invalid plan")
    }
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
    flat = flat.concat(_.flattenDeep(recurse(plan.content[NodeProp.PLANS])))

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
      plan.content.maxResult = largestResult[NodeProp.RESULT_SET_SIZE]
    }

    const largestEstimate = _.maxBy(flat, function (node: Node) {
      const cardinality: number = node[NodeProp.EXTRA_INFO][
        NodeProp.ESTIMATED_ROWS
      ] as unknown as number
      return cardinality != null ? cardinality : 0
    })

    if (largestEstimate) {
      plan.content.maxEstimatedRows = parseInt(
        largestEstimate[NodeProp.EXTRA_INFO][
          NodeProp.ESTIMATED_ROWS
        ] as unknown as string
      )
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
    // return this.fromText(source)
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
}
