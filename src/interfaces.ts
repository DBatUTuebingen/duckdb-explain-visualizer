import type {
  BufferLocation,
  HighlightType,
  SortGroupsProp,
  SortSpaceMemoryProp,
} from "@/enums"

export interface IPlan {
  id: string
  name: string
  content: IPlanContent
  query: string
  createdOn: Date
  planStats: IPlanStats
  formattedQuery?: string
  ctes: Node[]
  isAnalyze: boolean //NOT NEEDED FOR DDB
  isVerbose: boolean //NOT NEEDED FOR DDB
}

export interface IPlanContent {
  // Plan: Node //NOT NEEDED FOR DDB
  maxRows?: number
  maxRowsScanned ?: number
  maxEstimatedRows ?: number
  maxResult ?: number
  // maxCost?: number //NOT NEEDED FOR DDB
  // maxTotalCost?: number //NOT NEEDED FOR DDB
  maxDuration?: number
  // maxBlocks?: IBlocksStats //NOT NEEDED FOR DDB
  // maxIo?: number //NOT NEEDED FOR DDB
  // maxEstimateFactor?: number //NOT NEEDED FOR DDB
  // Triggers?: ITrigger[] //NOT NEEDED FOR DDB
  // JIT?: JIT //NOT NEEDED FOR DDB
  "Query Text"?: string
  [k: string]:
    | Node
    | number
    | string
    | IBlocksStats
    | ITrigger[]
    | JIT
    | undefined
}

export interface ITrigger {
  // MAYBE NOT NEEDED FOR DDB
  "Trigger Name": string
  Relation?: string
  Time: number
  Calls: string
}

export interface IPlanStats {
  executionTime?: number
  // planningTime?: number // NOT NEEDED FOR DDB
  maxRows: number
  maxRowsScanned: number
  maxEstimatedRows: number
  maxResult: number
  // maxCost: number // NOT NEEDED FOR DDB
  maxDuration: number
  // maxBlocks: IBlocksStats // NOT NEEDED FOR DDB
  // maxIo: number // NOT NEEDED FOR DDB
  // maxEstimateFactor: number // NOT NEEDED FOR DDB
  // triggers?: ITrigger[] // NOT NEEDED FOR DDB
  // jitTime?: number // NOT NEEDED FOR DDB
  settings?: Settings
}

export type IBlocksStats = {
  // MAYBE NOT NEEDED FOR DDB
  [key in BufferLocation]: number
}

import { EstimateDirection, NodeProp } from "@/enums"

// Class to create nodes when parsing text for DuckDB Explain Plans
export class Node {
  nodeId!: number
  size!: [number, number];

  // DuckDB specific properties
  [NodeProp.NODE_TYPE]?: string; // Type of operation in DuckDB (e.g., "Filter", "Scan")
  [NodeProp.ACTUAL_TOTAL_TIME]?: number; // Actual timing for the node if available
  [NodeProp.ACTUAL_ROWS]?: number; // Estimated number of rows
  [NodeProp.PLANS]: Node[];
  [NodeProp.CPU_TIME]: number;
  [NodeProp.CUMULATIVE_CARDINALITY]: number;
  [NodeProp.CUMULATIVE_ROWS_SCANNED]: number;
  [NodeProp.OPERATOR_ROWS_SCANNED]: number;
  [NodeProp.RESULT_SET_SIZE]: number;

  // Optional properties for advanced DuckDB Explain plans
  [NodeProp.EXTRA_INFO]: JSON;
  [NodeProp.RELATION_NAME]?: string;
  [NodeProp.PROJECTIONS]?: string | string[];
  [NodeProp.ESTIMATED_ROWS]?: string;
  [NodeProp.AGGREGATES]?: string | string[];
  [NodeProp.TABLE_INDEX]?: string;
  [NodeProp.GROUPS]?: string | string[];
  [NodeProp.JOIN_TYPE]?: string;
  [NodeProp.CONDITIONS]?: string | string[];
  [NodeProp.CTE_INDEX]?: string;
  [NodeProp.FILTER]?: string;
  [NodeProp.DELIM_INDEX]?: string;
  [NodeProp.FUNCTION]?: string;

  // --------------------------------------------------------------
  // BRAUCH ICH WAHRSCHEINLICH ALLES NICHT - wird erstmal drin gelasen
  ["Options"]?: Options;
  ["Timing"]?: Timing;
  ["Settings"]?: Settings;
  [NodeProp.ACTUAL_LOOPS]: number;
  [NodeProp.ACTUAL_ROWS_REVISED]: number;
  [NodeProp.ACTUAL_STARTUP_TIME]?: number;
  [NodeProp.EXCLUSIVE_COST]: number;
  [NodeProp.EXCLUSIVE_DURATION]: number;
  [NodeProp.EXCLUSIVE_LOCAL_DIRTIED_BLOCKS]: number;
  [NodeProp.EXCLUSIVE_LOCAL_HIT_BLOCKS]: number;
  [NodeProp.EXCLUSIVE_LOCAL_READ_BLOCKS]: number;
  [NodeProp.EXCLUSIVE_LOCAL_WRITTEN_BLOCKS]: number;
  [NodeProp.EXCLUSIVE_SHARED_DIRTIED_BLOCKS]: number;
  [NodeProp.EXCLUSIVE_SHARED_HIT_BLOCKS]: number;
  [NodeProp.EXCLUSIVE_SHARED_READ_BLOCKS]: number;
  [NodeProp.EXCLUSIVE_SHARED_WRITTEN_BLOCKS]: number;
  [NodeProp.EXCLUSIVE_TEMP_READ_BLOCKS]: number;
  [NodeProp.EXCLUSIVE_TEMP_WRITTEN_BLOCKS]: number;
  [NodeProp.PLANNER_ESTIMATE_DIRECTION]?: EstimateDirection;
  [NodeProp.PLANNER_ESTIMATE_FACTOR]?: number;
  [NodeProp.INDEX_NAME]?: string;
  [NodeProp.PARALLEL_AWARE]: boolean;
  [NodeProp.PLAN_ROWS]: number;
  [NodeProp.PLAN_ROWS_REVISED]?: number;
  [NodeProp.ROWS_REMOVED_BY_FILTER_REVISED]?: number;
  [NodeProp.ROWS_REMOVED_BY_JOIN_FILTER_REVISED]?: number;
  [NodeProp.SUBPLAN_NAME]?: string;
  [NodeProp.TOTAL_COST]: number;
  [NodeProp.WORKERS]?: Worker[];
  [NodeProp.WORKERS_LAUNCHED]?: number;
  [NodeProp.WORKERS_PLANNED]?: number;
  [NodeProp.WORKERS_PLANNED_BY_GATHER]?: number;
  [NodeProp.EXCLUSIVE_IO_READ_TIME]: number;
  [NodeProp.EXCLUSIVE_IO_WRITE_TIME]: number;
  [NodeProp.AVERAGE_IO_READ_TIME]: number;
  [NodeProp.AVERAGE_IO_WRITE_TIME]: number;
  // --------------------------------------------------------------

  [k: string]:
    | Node[]
    | Options
    | SortGroups
    | Timing
    | Worker[]
    | boolean
    | number
    | string
    | string[]
    | JSON
    | undefined
    | [number, number]

  constructor(type?: string) {
    if (!type) {
      return
    }
    this[NodeProp.NODE_TYPE] = type
    // tslint:disable-next-line:max-line-length
    const scanMatches =
      /^((?:Parallel\s+)?(?:Seq\sScan|Tid.*Scan|Bitmap\s+Heap\s+Scan|(?:Async\s+)?Foreign\s+Scan|Update|Insert|Delete))\son\s(\S+)(?:\s+(\S+))?$/.exec(
        type
      )
    const bitmapMatches = /^(Bitmap\s+Index\s+Scan)\son\s(\S+)$/.exec(type)
    // tslint:disable-next-line:max-line-length
    const indexMatches =
      /^((?:Parallel\s+)?Index(?:\sOnly)?\sScan(?:\sBackward)?)\susing\s(\S+)\son\s(\S+)(?:\s+(\S+))?$/.exec(
        type
      )
    const cteMatches = /^(CTE\sScan)\son\s(\S+)(?:\s+(\S+))?$/.exec(type)
    const functionMatches = /^(Function\sScan)\son\s(\S+)(?:\s+(\S+))?$/.exec(
      type
    )
    const subqueryMatches = /^(Subquery\sScan)\son\s(.+)$/.exec(type)
    if (scanMatches) {
      this[NodeProp.NODE_TYPE] = scanMatches[1]
      this[NodeProp.RELATION_NAME] = scanMatches[2]
      if (scanMatches[3]) {
        this[NodeProp.ALIAS] = scanMatches[3]
      }
    } else if (bitmapMatches) {
      this[NodeProp.NODE_TYPE] = bitmapMatches[1]
      this[NodeProp.INDEX_NAME] = bitmapMatches[2]
    } else if (indexMatches) {
      this[NodeProp.NODE_TYPE] = indexMatches[1]
      this[NodeProp.INDEX_NAME] = indexMatches[2]
      this[NodeProp.RELATION_NAME] = indexMatches[3]
      if (indexMatches[4]) {
        this[NodeProp.ALIAS] = indexMatches[4]
      }
    } else if (cteMatches) {
      this[NodeProp.NODE_TYPE] = cteMatches[1]
      this[NodeProp.CTE_NAME] = cteMatches[2]
      if (cteMatches[3]) {
        this[NodeProp.ALIAS] = cteMatches[3]
      }
    } else if (functionMatches) {
      this[NodeProp.NODE_TYPE] = functionMatches[1]
      this[NodeProp.FUNCTION_NAME] = functionMatches[2]
      if (functionMatches[3]) {
        this[NodeProp.ALIAS] = functionMatches[3]
      }
    } else if (subqueryMatches) {
      this[NodeProp.NODE_TYPE] = subqueryMatches[1]
      this[NodeProp.ALIAS] = subqueryMatches[2]
    }
    const parallelMatches = /^(Parallel\s+)(.*)/.exec(
      <string>this[NodeProp.NODE_TYPE]
    )
    if (parallelMatches) {
      this[NodeProp.NODE_TYPE] = parallelMatches[2]
      this[NodeProp.PARALLEL_AWARE] = true
    }

    const joinMatches = /(.*)\sJoin$/.exec(<string>this[NodeProp.NODE_TYPE])
    const joinModifierMatches = /(.*)\s+(Full|Left|Right|Anti)/.exec(
      <string>this[NodeProp.NODE_TYPE]
    )
    if (joinMatches) {
      this[NodeProp.NODE_TYPE] = joinMatches[1]
      if (joinModifierMatches) {
        this[NodeProp.NODE_TYPE] = joinModifierMatches[1]
        this[NodeProp.JOIN_TYPE] = joinModifierMatches[2]
      }
      this[NodeProp.NODE_TYPE] += " Join"
    }
  }
}

import { WorkerProp } from "@/enums"
// Class to create workers when parsing text
export class Worker {
  [k: string]: string | number | object
  constructor(workerNumber: number) {
    this[WorkerProp.WORKER_NUMBER] = workerNumber
  }
}

export type Options = {
  [k: string]: string
}

export type Timing = {
  [k: string]: number
}

export type Settings = {
  [k: string]: string
}

export type SortGroups = {
  [SortGroupsProp.SORT_METHODS_USED]: string[]
  [SortGroupsProp.SORT_SPACE_MEMORY]: SortSpaceMemory
  [key: string]: number | string | string[] | SortSpaceMemory
}

export type SortSpaceMemory = {
  [key in SortSpaceMemoryProp]: number
}

export type StatsTableItemType = {
  name: string
  count: number
  time: number
  timePercent: number
  nodes: Node[]
}

export type ViewOptions = {
  showHighlightBar: boolean
  showPlanStats: boolean
  highlightType: HighlightType
  diagramWidth: number
}

export interface JIT {
  ["Timing"]: Timing
  [key: string]: number | Timing
}

// A plan node with id, node, isLastSibling, branches
export type Row = [number, Node, boolean, number[]]
