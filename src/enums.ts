export enum Metric {
  time,
  rows,
  result,
}

export enum BufferLocation {
  shared = "Shared",
  temp = "Temp",
  local = "Local",
}

export enum BufferType {
  hit = "Hit",
  read = "Read",
  written = "Written",
  dirtied = "Dirtied",
}

export class HighlightType {
  public static NONE = "none"
  public static DURATION = "duration"
  public static ROWS = "rows"
  public static RESULT = "result"
}

export enum SortDirection {
  asc = "asc",
  desc = "desc",
}

export enum EstimateDirection {
  over = 1,
  under = 2,
  none = 3,
}

export enum CenterMode {
  center,
  visible,
  none,
}

export enum NodeProp {
  // plan property keys
  QUERY = "query_name",
  NODE_TYPE = "operator_type", // the name of each operator
  ACTUAL_ROWS = "operator_cardinality", // the number of rows it returns to its parent
  ACTUAL_TIME = "operator_timing", // the time taken by each operator
  BLOCKED_THREAD_TIME = "blocked_thread_time", // the total time threads are blocked
  PLANS = "children",
  CPU_TIME = "cpu_time",
  CUMULATIVE_CARDINALITY = "cumulative_cardinality",
  CUMULATIVE_ROWS_SCANNED = "cumulative_rows_scanned",
  OPERATOR_ROWS_SCANNED = "operator_rows_scanned", // The total rows scanned by each operator.
  RESULT_SET_SIZE = "result_set_size", // The size of the result.
  LATENCY = "latency",
  ROWS_RETURNED = "rows_returned",

  // EXTRA INFO KEYS
  EXTRA_INFO = "extra_info", // Unique operator metrics
  RELATION_NAME = "Text",
  PROJECTIONS = "Projections",
  ESTIMATED_ROWS = "Estimated Cardinality",
  AGGREGATES = "Aggregates",
  CTE_NAME = "CTE Name",
  TABLE_INDEX = "Table Index",
  GROUPS = "Groups",
  JOIN_TYPE = "Join Type",
  CONDITIONS = "Conditions",
  CTE_INDEX = "CTE Index",
  FILTER = "Expression",
  DELIM_INDEX = "Delim Index",
  FUNCTION = "Function",
  FUNCTION_NAME = "Name",

  // computed by dev
  NODE_ID = "nodeId",
  DEV_PLAN_TAG = "plan_",
}

export enum PropType {
  blocks,
  boolean,
  bytes,
  cost,
  duration,
  estimateDirection,
  factor,
  increment,
  json,
  kilobytes,
  list,
  loops,
  rows,
  sortGroups,
  transferRate,
}

export const nodePropTypes: { [key: string]: PropType } = {}

nodePropTypes[NodeProp.ACTUAL_ROWS] = PropType.rows
nodePropTypes[NodeProp.CUMULATIVE_CARDINALITY] = PropType.rows
nodePropTypes[NodeProp.CUMULATIVE_ROWS_SCANNED] = PropType.rows
nodePropTypes[NodeProp.OPERATOR_ROWS_SCANNED] = PropType.rows
nodePropTypes[NodeProp.CPU_TIME] = PropType.duration
nodePropTypes[NodeProp.BLOCKED_THREAD_TIME] = PropType.duration
nodePropTypes[NodeProp.RESULT_SET_SIZE] = PropType.bytes
nodePropTypes[NodeProp.ACTUAL_TIME] = PropType.duration
nodePropTypes[NodeProp.LATENCY] = PropType.duration
nodePropTypes[NodeProp.ROWS_RETURNED] = PropType.rows

export class WorkerProp {
  // plan property keys
  public static WORKER_NUMBER = "Worker Number"
}

nodePropTypes[WorkerProp.WORKER_NUMBER] = PropType.increment

export enum SortGroupsProp {
  GROUP_COUNT = "Group Count",
  SORT_METHODS_USED = "Sort Methods Used",
  SORT_SPACE_MEMORY = "Sort Space Memory",
}

export enum SortSpaceMemoryProp {
  AVERAGE_SORT_SPACE_USED = "Average Sort Space Used",
  PEAK_SORT_SPACE_USED = "Peak Sort Space Used",
}
