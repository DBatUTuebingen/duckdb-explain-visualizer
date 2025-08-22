<script lang="ts" setup>
import { inject, reactive, ref, watch, computed } from "vue"
import type { Ref } from "vue"
import {
  HighlightedNodeIdKey,
  PlanKey,
  SelectedNodeIdKey,
  SelectNodeKey,
  ViewOptionsKey,
} from "@/symbols"
import type { IPlan, Node, ViewOptions } from "@/interfaces"
import { BufferLocation, NodeProp, Metric } from "../enums"
import LevelDivider from "@/components/LevelDivider.vue"
import useNode from "@/node"

interface Props {
  node: Node
  level: number
  isSubplan: boolean
  isLastChild: boolean
  branches: number[]
  index: number
  viewOptions: {
    metric: Metric
    buffersMetric: BufferLocation
  }
}
const props = defineProps<Props>()
const node = reactive<Node>(props.node)
const diagramViewOptions = reactive(props.viewOptions)
const rootEl = ref(null)

const plan = inject(PlanKey) as Ref<IPlan>
const selectedNodeId = inject(SelectedNodeIdKey)
const selectNode = inject(SelectNodeKey)
if (!selectNode) {
  throw new Error(`Could not resolve ${SelectNodeKey.description}`)
}
const highlightedNodeId = inject(HighlightedNodeIdKey)

const viewOptions = inject(ViewOptionsKey) as ViewOptions
const { resultTooltip, nodeName, rowsTooltip, timeTooltip } = useNode(
  plan,
  node,
  viewOptions
)

const calculateCpuTimePercentage = computed(() => {
  if (typeof node[NodeProp.CPU_TIME] !== 'number' || typeof node[NodeProp.ACTUAL_TIME] !== 'number') {
    return 0;
  }
  const denominator = (plan.value.planStats.executionTime ?? plan.value.content[NodeProp.ACTUAL_TIME] ?? 1) as number;
  return Math.round(((node[NodeProp.CPU_TIME] - node[NodeProp.ACTUAL_TIME]) / denominator) * 100);
});

const hasCpuTime = computed(() => {
  return typeof node[NodeProp.CPU_TIME] === 'number' || typeof node[NodeProp.ACTUAL_TIME] === 'number';
});

const calculateRowsPercentage = computed(() => {
  if (typeof node[NodeProp.ACTUAL_ROWS] !== 'number' || !plan.value.planStats.maxRows) {
    return 0;
  }
  return Math.round((node[NodeProp.ACTUAL_ROWS] / plan.value.planStats.maxRows) * 100);
});

const hasRows = computed(() => {
  return typeof node[NodeProp.ACTUAL_ROWS] === 'number';
});

const calculateResultPercentage = computed(() => {
  if (typeof node[NodeProp.RESULT_SET_SIZE] !== 'number' || !plan.value.planStats.maxResult) {
    return 0;
  }
  return Math.round((node[NodeProp.RESULT_SET_SIZE] / plan.value.planStats.maxResult) * 100);
});

const hasResultSetSize = computed(() => {
  return typeof node[NodeProp.RESULT_SET_SIZE] === 'number' && node[NodeProp.RESULT_SET_SIZE] > 0;
});

function getTooltipContent(node: Node): string {
  let content = ""
  switch (diagramViewOptions.metric) {
    case Metric.time:
      content += timeTooltip.value
      break
    case Metric.rows:
      content += rowsTooltip.value
      break
    case Metric.result:
      content += resultTooltip.value
      break
  }
  if (node[NodeProp.EXTRA_INFO][NodeProp.CTE_NAME]) {
    content +=
      "<br><em>CTE " + node[NodeProp.EXTRA_INFO][NodeProp.CTE_NAME] + "</em>"
  }
  return content
}

const scrollTo = inject<(el: Element) => null>("scrollTo")

watch(
  () => selectedNodeId?.value,
  (newVal) => {
    if (newVal == node.nodeId && rootEl.value) {
      scrollTo?.(rootEl.value)
    }
  }
)
</script>

<template>
  <tr
    class="no-focus-outline node"
    :class="{
      selected: node.nodeId === selectedNodeId,
      highlight: node.nodeId === highlightedNodeId,
    }"
    :data-tippy-content="getTooltipContent(node)"
    @mouseenter="highlightedNodeId = node.nodeId"
    @mouseleave="highlightedNodeId = undefined"
    @click.prevent="selectNode(node.nodeId, true)"
    ref="rootEl"
  >
    <td class="node-index">
      <span class="fw-normal small">#{{ node.nodeId }} </span>
    </td>
    <td class="node-type pe-2"
        :style="!(hasCpuTime || hasRows || hasResultSetSize) ?{ width: '100%'} : {}">
      <level-divider
        :isSubplan="!!node[NodeProp.EXTRA_INFO][NodeProp.CTE_NAME]"
        :isLastChild="!!isLastChild"
        :level="level"
        :branches="branches"
        :index="index"
        dense
      ></level-divider>
      {{ nodeName }}
    </td>
    <td v-if="hasCpuTime || hasRows || hasResultSetSize">
      <!-- time -->
      <div
        class="progress rounded-0 align-items-center bg-transparent"
        style="height: 5px"
        v-if="diagramViewOptions.metric == Metric.time"
      >
        <div
          class="progress-bar border-secondary bg-secondary"
          :class="{
            'border-start': node[NodeProp.ACTUAL_TIME]! as number > 0,
          }"
          role="progressbar"
          style="height: 5px"
          :style="{
            width:
              (node[NodeProp.ACTUAL_TIME]! /
                (plan.planStats.executionTime! ||
                  plan.content[NodeProp.ACTUAL_TIME]! as number)) *
                100 +
              '%',
          }"
          aria-valuenow="15"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
        <div
          class="progress-bar bg-secondary-light"
          role="progressbar"
          style="height: 5px"
          :style="{
            width: calculateCpuTimePercentage + '%'
          }"
          aria-valuenow="15"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
      <!-- rows -->
      <div
        class="progress rounded-0 align-items-center bg-transparent"
        style="height: 5px"
        v-else-if="diagramViewOptions.metric == Metric.rows"
      >
        <div
          class="bg-secondary"
          role="progressbar"
          style="height: 5px"
          :style="{
            width: calculateRowsPercentage + '%',
          }"
          aria-valuenow="15"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
      <!-- result -->
      <div
        class="progress rounded-0 align-items-center bg-transparent"
        style="height: 5px"
        v-else-if="diagramViewOptions.metric == Metric.result"
      >
        <div
          class="bg-secondary"
          :class="{
            'border-secondary border-start': hasResultSetSize,
          }"
          role="progressbar"
          style="height: 5px"
          :style="{
            width: calculateResultPercentage + '%',
          }"
          aria-valuenow="15"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
    </td>
    <td v-else></td>
  </tr>
</template>
