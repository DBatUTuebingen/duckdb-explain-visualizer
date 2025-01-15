export enum Metric {
  time,
  rows,
  cost,
  buffers,
  estimate_factor,
  io,
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
  NODE_TYPE = "operator_type", // the name of each operator
  ACTUAL_ROWS = "operator_cardinality", // the number of rows it returns to its parent
  ACTUAL_TIME = "operator_timing", // the time taken by each operator
  BLOCKED_THREAD_TIME = "blocked_thread_time", // the total time threads are blocked
  PLANS = "children",
  // --------------------------------------------------------------
  // BRAUCH ICH WAHRSCHEINLICH ALLES NICHT - wird erstmal drin gelasen
  PLAN_ROWS = "Plan Rows",
  PLAN_WIDTH = "Plan Width",
  ROWS_REMOVED_BY_FILTER = "Rows Removed by Filter",
  ROWS_REMOVED_BY_JOIN_FILTER = "Rows Removed by Join Filter",
  ACTUAL_STARTUP_TIME = "Actual Startup Time",
  ACTUAL_LOOPS = "Actual Loops",
  STARTUP_COST = "Startup Cost",
  TOTAL_COST = "Total Cost",
  // --------------------------------------------------------------

  // NEW DUCKDB KEYS:
  CPU_TIME = "cpu_time",
  CUMULATIVE_CARDINALITY = "cumulative_cardinality",
  CUMULATIVE_ROWS_SCANNED = "cumulative_rows_scanned",
  OPERATOR_ROWS_SCANNED = "operator_rows_scanned", // The total rows scanned by each operator.
  RESULT_SET_SIZE = "result_set_size", // The size of the result.

  // EXTRA INFO KEYS
  EXTRA_INFO = "extra_info", // Unique operator metrics
  RELATION_NAME = "Text",
  PROJECTIONS = "Projections",
  ESTIMATED_ROWS = "Estimated Cardinality",
  AGGREGATES = "Aggregates",
  CTE_NAME = "CTE Name", // gehört zu extra_info keys
  TABLE_INDEX = "Table Index",
  GROUPS = "Groups",
  JOIN_TYPE = "Join Type",
  CONDITIONS = "Conditions",
  CTE_INDEX = "CTE Index",
  FILTER = "Expression",
  DELIM_INDEX = "Delim Index",
  FUNCTION = "Function",
  FUNCTION_NAME = "Name", // GEÄNDERT - gehört zu extra_info keys

  // --------------------------------------------------------------
  // BRAUCH ICH WAHRSCHEINLICH ALLES NICHT - wird erstmal drin gelasen
  SCHEMA = "Schema",
  ALIAS = "Alias",
  GROUP_KEY = "Group Key",
  SORT_KEY = "Sort Key",
  SORT_METHOD = "Sort Method",
  SORT_SPACE_TYPE = "Sort Space Type",
  SORT_SPACE_USED = "Sort Space Used",
  INDEX_NAME = "Index Name",
  HASH_CONDITION = "Hash Cond",
  PARENT_RELATIONSHIP = "Parent Relationship", // MAYBE NOT NEEDED FOR DDB
  SUBPLAN_NAME = "Subplan Name", // MAYBE NOT NEEDED FOR DDB
  PARALLEL_AWARE = "Parallel Aware",
  WORKERS = "Workers",
  WORKERS_PLANNED = "Workers Planned", // MAYBE NOT NEEDED FOR DDB
  WORKERS_LAUNCHED = "Workers Launched",
  SHARED_HIT_BLOCKS = "Shared Hit Blocks",
  SHARED_READ_BLOCKS = "Shared Read Blocks",
  SHARED_DIRTIED_BLOCKS = "Shared Dirtied Blocks",
  SHARED_WRITTEN_BLOCKS = "Shared Written Blocks",
  TEMP_READ_BLOCKS = "Temp Read Blocks",
  TEMP_WRITTEN_BLOCKS = "Temp Written Blocks",
  LOCAL_HIT_BLOCKS = "Local Hit Blocks",
  LOCAL_READ_BLOCKS = "Local Read Blocks",
  LOCAL_DIRTIED_BLOCKS = "Local Dirtied Blocks",
  LOCAL_WRITTEN_BLOCKS = "Local Written Blocks",
  IO_READ_TIME = "I/O Read Time",
  IO_WRITE_TIME = "I/O Write Time",
  OUTPUT = "Output",
  HEAP_FETCHES = "Heap Fetches",
  WAL_RECORDS = "WAL Records",
  WAL_BYTES = "WAL Bytes",
  WAL_FPI = "WAL FPI",
  FULL_SORT_GROUPS = "Full-sort Groups",
  PRE_SORTED_GROUPS = "Pre-sorted Groups",
  PRESORTED_KEY = "Presorted Key",
  STRATEGY = "Strategy", // MAYBE NOT NEEDED FOR DDB
  // --------------------------------------------------------------

  // computed by pev
  NODE_ID = "nodeId",
  EXCLUSIVE_DURATION = "*Duration (exclusive)",
  EXCLUSIVE_COST = "*Cost (exclusive)",
  ACTUAL_ROWS_REVISED = "*Actual Rows Revised",
  PLAN_ROWS_REVISED = "*Plan Rows Revised",
  ROWS_REMOVED_BY_FILTER_REVISED = "*Rows Removed by Filter",
  ROWS_REMOVED_BY_JOIN_FILTER_REVISED = "*Rows Removed by Join Filter",

  PLANNER_ESTIMATE_FACTOR = "*Planner Row Estimate Factor",
  PLANNER_ESTIMATE_DIRECTION = "*Planner Row Estimate Direction",

  EXCLUSIVE_SHARED_HIT_BLOCKS = "*Shared Hit Blocks (exclusive)",
  EXCLUSIVE_SHARED_READ_BLOCKS = "*Shared Read Blocks (exclusive)",
  EXCLUSIVE_SHARED_DIRTIED_BLOCKS = "*Shared Dirtied Blocks (exclusive)",
  EXCLUSIVE_SHARED_WRITTEN_BLOCKS = "*Shared Written Blocks (exclusive)",
  EXCLUSIVE_TEMP_READ_BLOCKS = "*Temp Read Blocks (exclusive)",
  EXCLUSIVE_TEMP_WRITTEN_BLOCKS = "*Temp Written Blocks (exclusive)",
  EXCLUSIVE_LOCAL_HIT_BLOCKS = "*Local Hit Blocks (exclusive)",
  EXCLUSIVE_LOCAL_READ_BLOCKS = "*Local Read Blocks (exclusive)",
  EXCLUSIVE_LOCAL_DIRTIED_BLOCKS = "*Local Dirtied Blocks (exclusive)",
  EXCLUSIVE_LOCAL_WRITTEN_BLOCKS = "*Local Written Blocks (exclusive)",

  EXCLUSIVE_IO_READ_TIME = "*I/O Read Time (exclusive)",
  EXCLUSIVE_IO_WRITE_TIME = "*I/O Write Time (exclusive)",
  AVERAGE_IO_READ_TIME = "*I/O Read Speed (exclusive)",
  AVERAGE_IO_WRITE_TIME = "*I/O Write Speed (exclusive)",

  WORKERS_PLANNED_BY_GATHER = "*Workers Planned By Gather", // MAYBE NOT NEEDED FOR DDB

  CTE_SCAN = "CTE Scan",

  ARRAY_INDEX_KEY = "arrayIndex",

  PEV_PLAN_TAG = "plan_",
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

nodePropTypes[NodeProp.ACTUAL_LOOPS] = PropType.loops
nodePropTypes[NodeProp.PLAN_ROWS] = PropType.rows
nodePropTypes[NodeProp.PLAN_WIDTH] = PropType.bytes
nodePropTypes[NodeProp.ACTUAL_ROWS_REVISED] = PropType.rows
nodePropTypes[NodeProp.PLAN_ROWS_REVISED] = PropType.rows
nodePropTypes[NodeProp.ACTUAL_TIME] = PropType.duration
nodePropTypes[NodeProp.ACTUAL_STARTUP_TIME] = PropType.duration
nodePropTypes[NodeProp.STARTUP_COST] = PropType.cost
nodePropTypes[NodeProp.TOTAL_COST] = PropType.cost
nodePropTypes[NodeProp.PARALLEL_AWARE] = PropType.boolean
nodePropTypes[NodeProp.WORKERS] = PropType.json
nodePropTypes[NodeProp.SORT_SPACE_USED] = PropType.kilobytes
nodePropTypes[NodeProp.ROWS_REMOVED_BY_FILTER] = PropType.rows
nodePropTypes[NodeProp.ROWS_REMOVED_BY_JOIN_FILTER] = PropType.rows
nodePropTypes[NodeProp.ROWS_REMOVED_BY_FILTER_REVISED] = PropType.rows
nodePropTypes[NodeProp.ROWS_REMOVED_BY_JOIN_FILTER_REVISED] = PropType.rows
nodePropTypes[NodeProp.HEAP_FETCHES] = PropType.rows
nodePropTypes[NodeProp.OUTPUT] = PropType.list
nodePropTypes[NodeProp.SORT_KEY] = PropType.list
nodePropTypes[NodeProp.PRESORTED_KEY] = PropType.list
nodePropTypes[NodeProp.WAL_RECORDS] = PropType.rows
nodePropTypes[NodeProp.WAL_BYTES] = PropType.bytes
nodePropTypes[NodeProp.WAL_FPI] = PropType.rows

nodePropTypes[NodeProp.EXCLUSIVE_DURATION] = PropType.duration
nodePropTypes[NodeProp.EXCLUSIVE_COST] = PropType.cost

nodePropTypes[NodeProp.PLANNER_ESTIMATE_FACTOR] = PropType.factor
nodePropTypes[NodeProp.PLANNER_ESTIMATE_DIRECTION] = PropType.estimateDirection

nodePropTypes[NodeProp.IO_READ_TIME] = PropType.duration
nodePropTypes[NodeProp.IO_WRITE_TIME] = PropType.duration

nodePropTypes[NodeProp.EXCLUSIVE_IO_READ_TIME] = PropType.duration
nodePropTypes[NodeProp.EXCLUSIVE_IO_WRITE_TIME] = PropType.duration
nodePropTypes[NodeProp.AVERAGE_IO_READ_TIME] = PropType.transferRate
nodePropTypes[NodeProp.AVERAGE_IO_WRITE_TIME] = PropType.transferRate

nodePropTypes[NodeProp.EXCLUSIVE_SHARED_HIT_BLOCKS] = PropType.blocks
nodePropTypes[NodeProp.EXCLUSIVE_SHARED_READ_BLOCKS] = PropType.blocks
nodePropTypes[NodeProp.EXCLUSIVE_SHARED_DIRTIED_BLOCKS] = PropType.blocks
nodePropTypes[NodeProp.EXCLUSIVE_SHARED_WRITTEN_BLOCKS] = PropType.blocks
nodePropTypes[NodeProp.EXCLUSIVE_TEMP_READ_BLOCKS] = PropType.blocks
nodePropTypes[NodeProp.EXCLUSIVE_TEMP_WRITTEN_BLOCKS] = PropType.blocks
nodePropTypes[NodeProp.EXCLUSIVE_LOCAL_HIT_BLOCKS] = PropType.blocks
nodePropTypes[NodeProp.EXCLUSIVE_LOCAL_READ_BLOCKS] = PropType.blocks
nodePropTypes[NodeProp.EXCLUSIVE_LOCAL_DIRTIED_BLOCKS] = PropType.blocks
nodePropTypes[NodeProp.EXCLUSIVE_LOCAL_WRITTEN_BLOCKS] = PropType.blocks

nodePropTypes[NodeProp.FULL_SORT_GROUPS] = PropType.sortGroups
nodePropTypes[NodeProp.PRE_SORTED_GROUPS] = PropType.sortGroups

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
