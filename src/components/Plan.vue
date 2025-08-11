<script lang="ts" setup>
import _ from "lodash"
import {
  computed,
  reactive,
  ref,
  nextTick,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  provide,
  watch,
} from "vue"
import { Splitpanes, Pane } from "splitpanes"

import type {
  IPlan,
  IPlanContent,
  IPlanStats,
  Node,
  Settings,
} from "@/interfaces"
import {
  HighlightedNodeIdKey,
  PlanKey,
  SelectedNodeIdKey,
  SelectNodeKey,
  ViewOptionsKey,
} from "@/symbols"
import Copy from "@/components/Copy.vue"
import Diagram from "@/components/Diagram.vue"
import Grid from "@/components/Grid.vue"
import LogoImage from "@/components/LogoImage.vue"
import PlanNode from "@/components/PlanNode.vue"
import PlanStats from "@/components/PlanStats.vue"
import Stats from "@/components/Stats.vue"
import { PlanService } from "@/services/plan-service"
import { findNodeById } from "@/services/help-service"
import { HighlightType, NodeProp } from "@/enums"
import { json_, pgsql_ } from "@/filters"

import "tippy.js/dist/tippy.css"
import * as d3 from "d3"
import {
  flextree,
  type FlexHierarchyPointLink,
  type FlexHierarchyPointNode,
} from "d3-flextree"
import type { ZoomTransform } from "d3"

interface Props {
  planSource: string
  planQuery: string
}
const props = defineProps<Props>()

const version = __APP_VERSION__ // eslint-disable-line no-undef

const rootEl = ref(null) // The root Element of this instance
const activeTab = ref<string>("")
const queryText = ref<string>("")
const parsed = ref<boolean>(false)
const plan = ref<IPlan>()
const planEl = ref()
const canvasRef = ref<HTMLCanvasElement | null>(null)
let planStats = reactive<IPlanStats>({} as IPlanStats)
const rootNode = computed(() => {
  if (plan.value!.content[NodeProp.CPU_TIME] !== undefined) {
    // plan is analyzed
    return plan.value && plan.value.content[NodeProp.PLANS][0]
  } else {
    // plan is not analyzed
    return plan.value && (plan.value.content as unknown as Node)
  }
})
const selectedNodeId = ref<number>(NaN)
const selectedNode = ref<Node | undefined>(undefined)
const highlightedNodeId = ref<number>(NaN)
const gridIsNotNew = localStorage.getItem("gridIsNotNew")

const viewOptions = reactive({
  showHighlightBar: false,
  showPlanStats: true,
  highlightType: HighlightType.NONE,
  diagramWidth: 20,
})

const planService = new PlanService()

// Vertical padding between 2 nodes in the tree layout
const padding = 40
const transform = ref<ZoomTransform>(d3.zoomIdentity)
const scale = ref(1)
const edgeWeight = computed(() => {
  return d3
    .scaleLinear()
    .domain([0, planStats.maxRows])
    .range([1, padding / 1.5])
})
const minScale = 0.2
const zoomListener = d3
  .zoom<HTMLCanvasElement, unknown>()
  .scaleExtent([minScale, 3])
  .on("zoom", function (e) {
    transform.value = e.transform
    scale.value = e.transform.k
    drawCanvas()
  })
const layoutRootNode = ref<null | FlexHierarchyPointNode<Node>>(null)
const ctes = ref<FlexHierarchyPointNode<Node>[]>([])

const layout = flextree({
  nodeSize: (node: FlexHierarchyPointNode<Node>) => {
    if (node.data.size) {
      return [node.data.size[0], node.data.size[1] + padding]
    }
    return [0, 0]
  },
  spacing: (
    nodeA: FlexHierarchyPointNode<Node>,
    nodeB: FlexHierarchyPointNode<Node>
  ) => Math.pow(nodeA.path(nodeB).length, 1.5),
})

const tree = ref(layout.hierarchy({}))

onBeforeMount(() => {
  const savedOptions = localStorage.getItem("viewOptions")
  if (savedOptions) {
    _.assignIn(viewOptions, JSON.parse(savedOptions))
  }
  let planJson: IPlanContent
  try {
    planJson = planService.fromSource(
      props.planSource
    ) as unknown as IPlanContent
    parsed.value = true
    setActiveTab("plan")
  } catch (e) {
    parsed.value = false
    plan.value = undefined
    return
  }
  queryText.value = (planJson[NodeProp.QUERY] as string) || props.planQuery
  // console.log("Query Name: " + queryText.value)
  plan.value = planService.createPlan("", planJson, queryText.value)
  const content = plan.value.content
  // console.log("CREATED PLAN: ")
  // console.log(content)
  planStats.blockedThreadTime =
    (planJson[NodeProp.BLOCKED_THREAD_TIME] as number) ?? NaN
  planStats.executionTime = (planJson[NodeProp.CPU_TIME] as number) ?? 0
  planStats.latency = (planJson[NodeProp.LATENCY] as number) ?? NaN
  planStats.rowsReturned = (planJson[NodeProp.ROWS_RETURNED] as number) ?? NaN
  planStats.resultSize = (planJson[NodeProp.RESULT_SET_SIZE] as number) ?? NaN
  planStats.maxRows = content.maxRows ?? NaN
  planStats.maxRowsScanned = content.maxRowsScanned ?? NaN
  planStats.maxResult = content.maxResult ?? NaN
  planStats.maxEstimatedRows = content.maxEstimatedRows ?? NaN
  planStats.maxDuration = content.maxDuration ?? NaN
  plan.value.planStats = planStats
  // console.log(plan.value.planStats)

  nextTick(() => {
    onHashChange()
  })
  window.addEventListener("hashchange", onHashChange)
  if (rootNode.value) {
    tree.value = layout.hierarchy(
      rootNode.value,
      (node: Node) => node[NodeProp.PLANS]
    )
  }
  doLayout()
})

function doLayout() {
  layoutRootNode.value = layout(tree.value)
  drawCanvas()
}

onMounted(() => {
  if (!planEl.value) return
  const canvas = canvasRef.value
  if (!canvas) return

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect
      const pixelRatio = window.devicePixelRatio || 1
      canvas.width = width * pixelRatio
      canvas.height = height * pixelRatio
      canvas.style.width = width + "px"
      canvas.style.height = height + "px"

      // Recalculate scale to fit entire plan
      if (layoutRootNode.value) {
        const extent = getLayoutExtent(layoutRootNode.value)
        const xScale = width / (extent[1] - extent[0] + 100) // Add padding
        const yScale = height / (extent[3] - extent[2] + 100) // Add padding
        const scale = Math.min(1, Math.min(xScale, yScale))

        // Center the plan
        const tx =
          (width - (extent[1] - extent[0]) * scale) / 2 - extent[0] * scale
        const ty =
          (height - (extent[3] - extent[2]) * scale) / 2 - extent[2] * scale

        d3.select<HTMLCanvasElement, unknown>(canvas).call(
          zoomListener.transform as any,
          d3.zoomIdentity.translate(tx, ty).scale(scale)
        )
      }
    }
  })

  resizeObserver.observe(planEl.value.$el)
  d3.select<HTMLCanvasElement, unknown>(canvas).call(zoomListener as any)

  return () => resizeObserver.disconnect()
})

function drawCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext("2d", { alpha: false })
  if (!ctx) return

  const pixelRatio = window.devicePixelRatio || 1

  // Clear canvas with proper dimensions
  ctx.fillStyle = "#efefef"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Start fresh
  ctx.setTransform(1, 0, 0, 1, 0, 0)

  // Enable antialiasing
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"

  // Apply transforms in correct order
  ctx.scale(pixelRatio, pixelRatio)
  ctx.translate(transform.value.x, transform.value.y)
  ctx.scale(transform.value.k, transform.value.k)

  // Draw connections
  layoutRootNode.value?.links().forEach((link) => {
    ctx.beginPath()
    ctx.strokeStyle = isNeverExecuted(link.target.data) ? "lightgrey" : "grey"
    ctx.lineCap = "round"
    ctx.setLineDash(isNeverExecuted(link.target.data) ? [10, 10] : [])
    ctx.lineWidth = edgeWeight.value(
      link.target.data[NodeProp.ACTUAL_ROWS] ?? 0
    )
    const path = new Path2D(lineGen.value(link))
    ctx.stroke(path)
  })

  // Reset transform instead of using save/restore
  ctx.setTransform(1, 0, 0, 1, 0, 0)

  // Update node positions
  layoutRootNode.value?.descendants().forEach((node) => {
    const x = node.x - node.xSize / 2
    const y = node.y
    const nodeElement = document.getElementById(`node-${node.data.nodeId}`)
    if (nodeElement) {
      nodeElement.style.transform = `translate(${
        x * transform.value.k + transform.value.x
      }px, ${y * transform.value.k + transform.value.y}px) scale(${
        transform.value.k
      })`
    }
  })
}

onBeforeUnmount(() => {
  window.removeEventListener("hashchange", onHashChange)
})

watch(viewOptions, onViewOptionsChanged)

function onViewOptionsChanged() {
  localStorage.setItem("viewOptions", JSON.stringify(viewOptions))
}

watch(selectedNodeId, onSelectedNode)

function onSelectedNode(v: number) {
  window.location.hash = v ? "plan/node/" + v : ""
  if (plan.value && v) {
    selectedNode.value = findNodeById(plan.value, v)
  }
}

const lineGen = computed(() => {
  return function (link: FlexHierarchyPointLink<object>) {
    const source = link.source
    const target = link.target
    const k = Math.abs(target.y - (source.y + source.ySize) - padding)
    const path = d3.path()
    path.moveTo(source.x, source.y + source.ySize / 2)
    path.lineTo(source.x, source.y + source.ySize - padding)
    path.bezierCurveTo(
      source.x,
      source.y + source.ySize - padding + k / 2,
      target.x,
      target.y - k / 2,
      target.x,
      target.y
    )
    return path.toString()
  }
})

function onHashChange(): void {
  const reg = /#([a-zA-Z]*)(\/node\/([0-9]*))*/
  const matches = reg.exec(window.location.hash)
  if (matches) {
    const tab = matches[1] || "plan"
    setActiveTab(tab)
    const nodeId = parseInt(matches[3], 0)
    if (
      tab == "plan" &&
      nodeId !== undefined &&
      nodeId != selectedNodeId.value
    ) {
      // Delayed to make sure the tab has changed before recentering
      setTimeout(() => {
        selectNode(nodeId, true)
      }, 1)
    }
  }
}

provide(SelectedNodeIdKey, selectedNodeId)
provide(HighlightedNodeIdKey, highlightedNodeId)
provide("updateNodeSize", updateNodeSize)

function selectNode(nodeId: number, center: boolean): void {
  center = !!center
  selectedNodeId.value = nodeId
  if (center) {
    centerNode(nodeId)
  }
}
provide(SelectNodeKey, selectNode)
provide(ViewOptionsKey, viewOptions)
provide(PlanKey, plan)

function centerNode(nodeId: number): void {
  const rect = planEl.value.$el.getBoundingClientRect()
  const treeNode = findTreeNode(nodeId)
  if (!treeNode) {
    return
  }
  const pixelRatio = window.devicePixelRatio || 1
  let x = -treeNode["x"]
  let y = -treeNode["y"]
  let k = scale.value
  x = x * k + rect.width / 2
  y = y * k + rect.height / 2
  const canvas = canvasRef.value
  if (canvas) {
    d3.select<HTMLCanvasElement, unknown>(canvas)
      .transition()
      .duration(500)
      .call(
        zoomListener.transform as any,
        d3.zoomIdentity.translate(x, y).scale(k)
      )
  }
}

function findTreeNode(nodeId: number) {
  const trees = [layoutRootNode.value].concat(ctes.value)
  let found: undefined | FlexHierarchyPointNode<Node> = undefined
  _.each(trees, (tree) => {
    found = _.find(tree?.descendants(), (o) => o.data.nodeId == nodeId)
    return !found
  })
  return found
}

const setActiveTab = (tab: string) => {
  activeTab.value = tab
}

function getLayoutExtent(
  layoutRootNode: FlexHierarchyPointNode<Node>
): [number, number, number, number] {
  const minX =
    _.min(
      _.map(layoutRootNode.descendants(), (childNode) => {
        return childNode.x - childNode.xSize / 2
      })
    ) || 0

  const maxX =
    _.max(
      _.map(layoutRootNode.descendants(), (childNode) => {
        return childNode.x + childNode.xSize / 2
      })
    ) || 0

  const minY =
    _.min(
      _.map(layoutRootNode.descendants(), (childNode) => {
        return childNode.y
      })
    ) || 0

  const maxY =
    _.max(
      _.map(layoutRootNode.descendants(), (childNode) => {
        return childNode.y + childNode.ySize
      })
    ) || 0
  return [minX, maxX, minY, maxY]
}

function isNeverExecuted(node: Node): boolean {
  return (
    !!planStats.executionTime &&
    !node[NodeProp.ACTUAL_TIME] &&
    !node[NodeProp.ACTUAL_ROWS]
  )
}

watch(
  () => {
    const data: [number, number][] = []
    data.concat(
      tree.value
        .descendants()
        .map((item: FlexHierarchyPointNode<Node>) => item.data.size)
    )
    _.each(ctes.value, (tree) => {
      data.concat(
        tree
          .descendants()
          .map((item: FlexHierarchyPointNode<Node>) => item.data.size)
      )
    })
    return data
  },
  () => {
    doLayout()
  },
  { deep: true }
)

function updateNodeSize(node: Node, size: [number, number]) {
  node.size = [size[0] / scale.value, size[1] / scale.value]
  nextTick(() => doLayout())
}
</script>

<template>
  <div v-if="!parsed" class="flex-grow-1 d-flex justify-content-center">
    <div class="card align-self-center border-danger w-50">
      <div class="card-body">
        <h5 class="card-title text-danger">Couldn't parse plan</h5>
        <h6 class="card-subtitle mb-2 text-body-secondary">
          An error occured while parsing the plan
        </h6>
        <div class="overflow-hidden d-flex w-100 h-100 position-relative mb-3">
          <div class="overflow-auto flex-grow-1">
            <pre
              class="small p-2 mb-0"
              style="max-height: 200px"
            ><code v-html="planSource"></code></pre>
          </div>
          <copy :content="planSource" />
        </div>
        <p class="card-text text-body-dark">
          The plan you submited couldn't be parsed. This may be a bug. You can
          help us fix it by opening a new issue.
        </p>
        <div class="d-flex align-items-center">
          <span class="text-secondary">
            <logo-image />
            DEV <i>version {{ version }}</i>
          </span>
          <a
            href="https://github.com/DBatUTuebingen/pev2/issues"
            target="_blank"
            class="btn btn-primary ms-auto"
            >Open an issue on Github</a
          >
        </div>
      </div>
    </div>
  </div>
  <div
    class="plan-container d-flex flex-column overflow-hidden flex-grow-1 bg-light"
    v-else
    ref="rootEl"
  >
    <div class="d-flex align-items-center">
      <ul class="nav nav-pills">
        <li class="nav-item p-1">
          <a
            class="nav-link px-2 py-0"
            :class="{ active: activeTab === 'plan' }"
            href="#plan"
            >Plan</a
          >
        </li>
        <li class="nav-item p-1">
          <a
            class="nav-link px-2 py-0 position-relative"
            :class="{ active: activeTab === 'grid' }"
            href="#grid"
            >Grid
            <span
              class="badge bg-info"
              style="font-size: 0.6em"
              v-if="!gridIsNotNew"
            >
              new
            </span>
          </a>
        </li>
        <li class="nav-item p-1">
          <a
            class="nav-link px-2 py-0"
            :class="{ active: activeTab === 'raw' }"
            href="#raw"
            >Raw</a
          >
        </li>
        <li class="nav-item p-1">
          <a
            class="nav-link px-2 py-0"
            :class="{ active: activeTab === 'query', disabled: !queryText }"
            href="#query"
            >Query</a
          >
        </li>
        <li class="nav-item p-1">
          <a
            class="nav-link px-2 py-0"
            :class="{ active: activeTab === 'stats' }"
            href="#stats"
            >Stats</a
          >
        </li>
      </ul>
      <div class="ms-auto me-2 small">
        <a href="https://github.com/DBatUTuebingen/pev2" target="_blank">
          <logo-image />
          duckdb-explain-visualizer 1.0.0
          <!--{{ version }}-->
        </a>
      </div>
    </div>
    <div class="tab-content flex-grow-1 d-flex overflow-hidden">
      <div
        class="tab-pane flex-grow-1 overflow-hidden"
        :class="{ 'show active d-flex': activeTab === 'plan' }"
      >
        <!-- Plan tab -->
        <div class="d-flex flex-column flex-grow-1 overflow-hidden">
          <PlanStats></PlanStats>
          <div class="flex-grow-1 d-flex overflow-hidden">
            <div class="flex-grow-1 overflow-hidden">
              <splitpanes
                class="default-theme"
                @resize="viewOptions.diagramWidth = $event[0].size"
              >
                <pane
                  :size="viewOptions.diagramWidth"
                  class="d-flex flex-column"
                  v-if="plan"
                >
                  <diagram
                    ref="diagram"
                    class="d-flex flex-column flex-grow-1 overflow-hidden plan-diagram"
                  >
                  </diagram>
                </pane>
                <pane ref="planEl" class="plan grab-bing position-relative">
                  <div
                    class="position-absolute m-1 p-1 bottom-0 end-0 rounded bg-white d-flex"
                    v-if="plan"
                  >
                    <div
                      class="btn-group btn-group-xs"
                      style="z-index: 1; background: white"
                    >
                      <button
                        class="btn btn-outline-secondary"
                        :class="{
                          active:
                            viewOptions.highlightType === HighlightType.NONE,
                        }"
                        v-on:click="
                          viewOptions.highlightType = HighlightType.NONE
                        "
                      >
                        none
                      </button>
                      <button
                        class="btn btn-outline-secondary"
                        :class="{
                          active:
                            viewOptions.highlightType ===
                            HighlightType.DURATION,
                        }"
                        v-on:click="
                          viewOptions.highlightType = HighlightType.DURATION
                        "
                        :disabled="false /*!plan.isAnalyze*/"
                      >
                        duration
                      </button>
                      <button
                        class="btn btn-outline-secondary"
                        :class="{
                          active:
                            viewOptions.highlightType === HighlightType.ROWS,
                        }"
                        v-on:click="
                          viewOptions.highlightType = HighlightType.ROWS
                        "
                        :disabled="
                          !rootNode || rootNode[NodeProp.CPU_TIME] === undefined
                        "
                      >
                        rows
                      </button>
                      <button
                        class="btn btn-outline-secondary"
                        :class="{
                          active:
                            viewOptions.highlightType === HighlightType.RESULT,
                        }"
                        v-on:click="
                          viewOptions.highlightType = HighlightType.RESULT
                        "
                        :disabled="
                          !rootNode || rootNode[NodeProp.CPU_TIME] === undefined
                        "
                      >
                        result
                      </button>
                    </div>
                  </div>
                  <canvas
                    ref="canvasRef"
                    style="width: 100%; height: 100%"
                  ></canvas>
                  <div class="node-overlay">
                    <div
                      v-for="node in layoutRootNode?.descendants()"
                      :key="node.data.nodeId"
                      :id="`node-${node.data.nodeId}`"
                      class="absolute-node"
                    >
                      <plan-node :node="node.data" />
                    </div>
                  </div>
                </pane>
              </splitpanes>
            </div>
          </div>
          <!-- end Plan tab -->
        </div>
      </div>
      <div
        class="tab-pane flex-grow-1 overflow-hidden position-relative"
        :class="{ 'show active': activeTab === 'grid' }"
        v-if="activeTab === 'grid'"
      >
        <div class="overflow-hidden d-flex w-100 h-100 flex-column">
          <plan-stats></plan-stats>
          <grid class="flex-grow-1 overflow-auto plan-grid"> </grid>
        </div>
      </div>
      <div
        class="tab-pane flex-grow-1 overflow-hidden position-relative"
        :class="{ 'show active': activeTab === 'raw' }"
      >
        <div class="overflow-hidden d-flex w-100 h-100">
          <div class="overflow-auto flex-grow-1">
            <pre
              class="small p-2 mb-0"
            ><code v-html="json_(planSource)"></code></pre>
          </div>
          <copy :content="planSource" />
        </div>
      </div>
      <div
        class="tab-pane flex-grow-1 overflow-hidden position-relative"
        :class="{ 'show active': activeTab === 'query' }"
        v-if="queryText"
      >
        <div class="overflow-hidden d-flex w-100 h-100">
          <div class="overflow-auto flex-grow-1">
            <pre
              class="small p-2 mb-0"
            ><code v-html="pgsql_(queryText)"></code></pre>
          </div>
        </div>
        <copy :content="queryText" />
      </div>
      <div
        class="tab-pane flex-grow-1 overflow-auto"
        :class="{ 'show active': activeTab === 'stats' }"
      >
        <stats v-if="plan"></stats>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@use "../assets/scss/variables" as *;
@use "../assets/scss/pev2" as *;
@use "highlight.js/scss/stackoverflow-light.scss" as *;
@import "splitpanes/dist/splitpanes.css";

path {
  stroke-linecap: butt;

  &.never-executed {
    stroke-dasharray: 0.5em;
    stroke-opacity: 0.5;
  }
}

canvas {
  touch-action: none;
}

.plan {
  position: relative;
}

.node-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.absolute-node {
  position: absolute;
  transform-origin: left top;
  pointer-events: all;
}
</style>
