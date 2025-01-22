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
}

export interface IPlanContent {
  maxRows?: number
  maxRowsScanned ?: number
  maxEstimatedRows ?: number
  maxResult ?: number
  maxDuration?: number
  "Query Text"?: string
  [k: string]:
    | Node
    | number
    | string
    | undefined
}

export interface IPlanStats {
  executionTime?: number
  maxRows: number
  maxRowsScanned: number
  maxEstimatedRows: number
  maxResult: number
  maxDuration: number
}

import { NodeProp } from "@/enums"

// Class to create nodes when parsing text for DuckDB Explain Plans
export class Node {
  nodeId!: number
  size!: [number, number];

  // DuckDB specific properties
  [NodeProp.NODE_TYPE]?: string; // Type of operation in DuckDB (e.g., "Filter", "Scan")
  [NodeProp.ACTUAL_TIME]?: number; // Actual timing for the node if available
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
  [NodeProp.CTE_NAME]?: string;
  [NodeProp.TABLE_INDEX]?: string;
  [NodeProp.GROUPS]?: string | string[];
  [NodeProp.JOIN_TYPE]?: string;
  [NodeProp.CONDITIONS]?: string | string[];
  [NodeProp.CTE_INDEX]?: string;
  [NodeProp.FILTER]?: string;
  [NodeProp.DELIM_INDEX]?: string;
  [NodeProp.FUNCTION]?: string;
  [NodeProp.FUNCTION_NAME]?: string;
  [k: string]:
    | Node[]
    | Timing
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
