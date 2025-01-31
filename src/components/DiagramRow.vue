<script lang="ts" setup>
import { inject, reactive, ref, watch } from "vue"
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
const {
  resultTooltip,
  nodeName,
  rowsTooltip,
  timeTooltip
} = useNode(plan, node, viewOptions)

function getTooltipContent(node: Node): string {
  let content = ""
  switch (diagramViewOptions.metric) {
    case Metric.time:
      content += timeTooltip.value
      break
    case Metric.rows:
      content += rowsTooltip.value
      break
    // case Metric.estimate_factor:
    //   content += estimateFactorTooltip.value
    //   break
    case Metric.result:
      content += resultTooltip.value
      break
    // case Metric.buffers:
    //   content += buffersByLocationTooltip.value(
    //     diagramViewOptions.buffersMetric
    //   )
    //   break
    // case Metric.io:
    //   content += ioTooltip.value
    //   break
  }
  if (node[NodeProp.EXTRA_INFO][NodeProp.CTE_NAME]) {
    content += "<br><em>CTE " + node[NodeProp.EXTRA_INFO][NodeProp.CTE_NAME] + "</em>"
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
    <td class="node-type pe-2">
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
    <td>
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
            width:
              ((node[NodeProp.CPU_TIME] -
                node[NodeProp.ACTUAL_TIME]!) /
                (plan.planStats.executionTime! ||
                  plan.content[NodeProp.ACTUAL_TIME]! as number)) *
                100 +
              '%',
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
            width:
              Math.round(
                (node[NodeProp.ACTUAL_ROWS]! / plan.planStats.maxRows) *
                  100
              ) + '%',
          }"
          aria-valuenow="15"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
      <!-- estimation -->
<!--      <div-->
<!--        class="progress rounded-0 align-items-center bg-transparent justify-content-center"-->
<!--        style="height: 10px"-->
<!--        v-else-if="diagramViewOptions.metric == Metric.estimate_factor"-->
<!--      >-->
<!--        <span class="text-secondary small">-->
<!--          <FontAwesomeIcon-->
<!--            fixed-width-->
<!--            :icon="faArrowDown"-->
<!--            v-if="-->
<!--              node[NodeProp.PLANNER_ESTIMATE_DIRECTION] ===-->
<!--              EstimateDirection.under-->
<!--            "-->
<!--          ></FontAwesomeIcon>-->
<!--          <i class="fa fa-fw d-inline-block" v-else />-->
<!--        </span>-->
<!--        <div-->
<!--          class="progress-bar"-->
<!--          :class="[-->
<!--            node[NodeProp.PLANNER_ESTIMATE_DIRECTION] ===-->
<!--            EstimateDirection.under-->
<!--              ? 'bg-secondary'-->
<!--              : 'bg-transparent',-->
<!--          ]"-->
<!--          role="progressbar"-->
<!--          style="height: 5px"-->
<!--          :style="{ width: estimateFactorPercent + '%' }"-->
<!--          aria-valuenow="15"-->
<!--          aria-valuemin="0"-->
<!--          aria-valuemax="100"-->
<!--        ></div>-->
<!--        <div-->
<!--          class="progress-bar border-start bg-secondary"-->
<!--          role="progressbar"-->
<!--          style="width: 1px; height: 5px"-->
<!--          aria-valuenow="15"-->
<!--          aria-valuemin="0"-->
<!--          aria-valuemax="100"-->
<!--        ></div>-->
<!--        <div-->
<!--          class="progress-bar"-->
<!--          :class="[-->
<!--            node[NodeProp.PLANNER_ESTIMATE_DIRECTION] === EstimateDirection.over-->
<!--              ? 'bg-secondary'-->
<!--              : 'bg-transparent',-->
<!--          ]"-->
<!--          role="progressbar"-->
<!--          style="height: 5px"-->
<!--          :style="{ width: estimateFactorPercent + '%' }"-->
<!--          aria-valuenow="15"-->
<!--          aria-valuemin="0"-->
<!--          aria-valuemax="100"-->
<!--        ></div>-->
<!--        <span class="text-secondary small">-->
<!--          <FontAwesomeIcon-->
<!--            fixed-width-->
<!--            :icon="faArrowUp"-->
<!--            v-if="-->
<!--              node[NodeProp.PLANNER_ESTIMATE_DIRECTION] ===-->
<!--              EstimateDirection.over-->
<!--            "-->
<!--          ></FontAwesomeIcon>-->
<!--          <i class="fa fa-fw d-inline-block" v-else />-->
<!--        </span>-->
<!--      </div>-->
      <!-- cost -->
      <div
        class="progress rounded-0 align-items-center bg-transparent"
        style="height: 5px"
        v-else-if="diagramViewOptions.metric == Metric.result"
      >
        <div
          class="bg-secondary"
          :class="{
            'border-secondary border-start': node[NodeProp.RESULT_SET_SIZE] > 0,
          }"
          role="progressbar"
          style="height: 5px"
          :style="{
            width:
              Math.round(
                (node[NodeProp.RESULT_SET_SIZE] / plan.planStats.maxResult) * 100
              ) + '%',
          }"
          aria-valuenow="15"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
      <!-- buffers shared -->
<!--      <div-->
<!--        class="progress rounded-0 align-items-center bg-transparent"-->
<!--        style="height: 5px"-->
<!--        v-else-if="-->
<!--          diagramViewOptions.metric == Metric.buffers &&-->
<!--          diagramViewOptions.buffersMetric == BufferLocation.shared &&-->
<!--          plan.planStats.maxBlocks?.[BufferLocation.shared]-->
<!--        "-->
<!--      >-->
<!--        <div-->
<!--          class="bg-hit"-->
<!--          :class="{-->
<!--            'border-start border-hit':-->
<!--              node[NodeProp.EXCLUSIVE_SHARED_HIT_BLOCKS] > 0,-->
<!--          }"-->
<!--          role="progressbar"-->
<!--          style="height: 5px"-->
<!--          :style="{-->
<!--            width:-->
<!--              (Math.round(-->
<!--                (node[NodeProp.EXCLUSIVE_SHARED_HIT_BLOCKS] /-->
<!--                  plan.planStats.maxBlocks?.[BufferLocation.shared]) *-->
<!--                  100-->
<!--              ) || 0) + '%',-->
<!--          }"-->
<!--          aria-valuenow="15"-->
<!--          aria-valuemin="0"-->
<!--          aria-valuemax="100"-->
<!--        ></div>-->
<!--        <div-->
<!--          class="bg-read"-->
<!--          role="progressbar"-->
<!--          :class="{-->
<!--            'border-start border-read':-->
<!--              node[NodeProp.EXCLUSIVE_SHARED_READ_BLOCKS] > 0,-->
<!--          }"-->
<!--          style="height: 5px"-->
<!--          :style="{-->
<!--            width:-->
<!--              (Math.round(-->
<!--                (node[NodeProp.EXCLUSIVE_SHARED_READ_BLOCKS] /-->
<!--                  plan.planStats.maxBlocks?.[BufferLocation.shared]) *-->
<!--                  100-->
<!--              ) || 0) + '%',-->
<!--          }"-->
<!--          aria-valuenow="15"-->
<!--          aria-valuemin="0"-->
<!--          aria-valuemax="100"-->
<!--        ></div>-->
<!--        <div-->
<!--          class="bg-dirtied"-->
<!--          :class="{-->
<!--            'border-start border-dirtied':-->
<!--              node[NodeProp.EXCLUSIVE_SHARED_DIRTIED_BLOCKS] > 0,-->
<!--          }"-->
<!--          role="progressbar"-->
<!--          style="height: 5px"-->
<!--          :style="{-->
<!--            width:-->
<!--              (Math.round(-->
<!--                (node[NodeProp.EXCLUSIVE_SHARED_DIRTIED_BLOCKS] /-->
<!--                  plan.planStats.maxBlocks?.[BufferLocation.shared]) *-->
<!--                  100-->
<!--              ) || 0) + '%',-->
<!--          }"-->
<!--          aria-valuenow="15"-->
<!--          aria-valuemin="0"-->
<!--          aria-valuemax="100"-->
<!--        ></div>-->
<!--        <div-->
<!--          class="bg-written"-->
<!--          :class="{-->
<!--            'border-start border-written':-->
<!--              node[NodeProp.EXCLUSIVE_SHARED_WRITTEN_BLOCKS] > 0,-->
<!--          }"-->
<!--          role="progressbar"-->
<!--          style="height: 5px"-->
<!--          :style="{-->
<!--            width:-->
<!--              (Math.round(-->
<!--                (node[NodeProp.EXCLUSIVE_SHARED_WRITTEN_BLOCKS] /-->
<!--                  plan.planStats.maxBlocks?.[BufferLocation.shared]) *-->
<!--                  100-->
<!--              ) || 0) + '%',-->
<!--          }"-->
<!--          aria-valuenow="15"-->
<!--          aria-valuemin="0"-->
<!--          aria-valuemax="100"-->
<!--        ></div>-->
<!--      </div>-->
      <!-- buffers temp -->
<!--      <div-->
<!--        class="progress rounded-0 align-items-center bg-transparent"-->
<!--        style="height: 5px"-->
<!--        v-else-if="-->
<!--          diagramViewOptions.metric == Metric.buffers &&-->
<!--          diagramViewOptions.buffersMetric == BufferLocation.temp &&-->
<!--          plan.planStats.maxBlocks?.[BufferLocation.temp]-->
<!--        "-->
<!--      >-->
<!--        <div-->
<!--          class="bg-read"-->
<!--          role="progressbar"-->
<!--          style="height: 5px"-->
<!--          :style="{-->
<!--            width:-->
<!--              (Math.round(-->
<!--                (node[NodeProp.EXCLUSIVE_TEMP_READ_BLOCKS] /-->
<!--                  plan.planStats.maxBlocks?.[BufferLocation.temp]) *-->
<!--                  100-->
<!--              ) || 0) + '%',-->
<!--          }"-->
<!--          aria-valuenow="15"-->
<!--          aria-valuemin="0"-->
<!--          aria-valuemax="100"-->
<!--        ></div>-->
<!--        <div-->
<!--          class="bg-written"-->
<!--          role="progressbar"-->
<!--          :style="{-->
<!--            width:-->
<!--              (Math.round(-->
<!--                (node[NodeProp.EXCLUSIVE_TEMP_WRITTEN_BLOCKS] /-->
<!--                  plan.planStats.maxBlocks?.[BufferLocation.temp]) *-->
<!--                  100-->
<!--              ) || 0) + '%',-->
<!--          }"-->
<!--          aria-valuenow="15"-->
<!--          aria-valuemin="0"-->
<!--          aria-valuemax="100"-->
<!--          style="height: 5px"-->
<!--        ></div>-->
<!--      </div>-->
<!--      &lt;!&ndash; buffers local &ndash;&gt;-->
<!--      <div-->
<!--        class="progress rounded-0 align-items-center bg-transparent"-->
<!--        style="height: 5px"-->
<!--        v-else-if="-->
<!--          diagramViewOptions.metric == Metric.buffers &&-->
<!--          diagramViewOptions.buffersMetric == BufferLocation.local &&-->
<!--          plan.planStats.maxBlocks?.[BufferLocation.local]-->
<!--        "-->
<!--      >-->
<!--        <div-->
<!--          class="bg-hit"-->
<!--          role="progressbar"-->
<!--          style="height: 5px"-->
<!--          :style="{-->
<!--            width:-->
<!--              (Math.round(-->
<!--                (node[NodeProp.EXCLUSIVE_LOCAL_HIT_BLOCKS] /-->
<!--                  plan.planStats.maxBlocks?.[BufferLocation.local]) *-->
<!--                  100-->
<!--              ) || 0) + '%',-->
<!--          }"-->
<!--          aria-valuenow="15"-->
<!--          aria-valuemin="0"-->
<!--          aria-valuemax="100"-->
<!--        ></div>-->
<!--        <div-->
<!--          class="bg-read"-->
<!--          role="progressbar"-->
<!--          :style="{-->
<!--            width:-->
<!--              (Math.round(-->
<!--                (node[NodeProp.EXCLUSIVE_LOCAL_READ_BLOCKS] /-->
<!--                  plan.planStats.maxBlocks?.[BufferLocation.local]) *-->
<!--                  100-->
<!--              ) || 0) + '%',-->
<!--          }"-->
<!--          aria-valuenow="15"-->
<!--          aria-valuemin="0"-->
<!--          aria-valuemax="100"-->
<!--          style="height: 5px"-->
<!--        ></div>-->
<!--        <div-->
<!--          class="bg-dirtied"-->
<!--          role="progressbar"-->
<!--          style="height: 5px"-->
<!--          :style="{-->
<!--            width:-->
<!--              (Math.round(-->
<!--                (node[NodeProp.EXCLUSIVE_LOCAL_DIRTIED_BLOCKS] /-->
<!--                  plan.planStats.maxBlocks?.[BufferLocation.local]) *-->
<!--                  100-->
<!--              ) || 0) + '%',-->
<!--          }"-->
<!--          aria-valuenow="15"-->
<!--          aria-valuemin="0"-->
<!--          aria-valuemax="100"-->
<!--        ></div>-->
<!--        <div-->
<!--          class="bg-written"-->
<!--          role="progressbar"-->
<!--          style="height: 5px"-->
<!--          :style="{-->
<!--            width:-->
<!--              (Math.round(-->
<!--                (node[NodeProp.EXCLUSIVE_LOCAL_WRITTEN_BLOCKS] /-->
<!--                  plan.planStats?.maxBlocks?.[BufferLocation.local]) *-->
<!--                  100-->
<!--              ) || 0) + '%',-->
<!--          }"-->
<!--          aria-valuenow="15"-->
<!--          aria-valuemin="0"-->
<!--          aria-valuemax="100"-->
<!--        ></div>-->
<!--      </div>-->
<!--      &lt;!&ndash; io &ndash;&gt;-->
<!--      <div-->
<!--        class="progress rounded-0 align-items-center bg-transparent"-->
<!--        style="height: 5px"-->
<!--        v-else-if="-->
<!--          diagramViewOptions.metric == Metric.io &&-->
<!--          (plan.content[NodeProp['IO_READ_TIME']] ||-->
<!--            plan.content[NodeProp['IO_WRITE_TIME']])-->
<!--        "-->
<!--      >-->
<!--        <div-->
<!--          class="bg-read"-->
<!--          role="progressbar"-->
<!--          style="height: 5px"-->
<!--          :style="{-->
<!--            width:-->
<!--              (Math.round(-->
<!--                (node[NodeProp.EXCLUSIVE_IO_READ_TIME] /-->
<!--                  plan.planStats?.maxIo) *-->
<!--                  100-->
<!--              ) || 0) + '%',-->
<!--          }"-->
<!--          aria-valuenow="15"-->
<!--          aria-valuemin="0"-->
<!--          aria-valuemax="100"-->
<!--        ></div>-->
<!--        <div-->
<!--          class="bg-written"-->
<!--          role="progressbar"-->
<!--          style="height: 5px"-->
<!--          :style="{-->
<!--            width:-->
<!--              (Math.round(-->
<!--                (node[NodeProp.EXCLUSIVE_IO_WRITE_TIME] /-->
<!--                  plan.planStats?.maxIo) *-->
<!--                  100-->
<!--              ) || 0) + '%',-->
<!--          }"-->
<!--          aria-valuenow="15"-->
<!--          aria-valuemin="0"-->
<!--          aria-valuemax="100"-->
<!--        ></div>-->
<!--      </div>-->
    </td>
  </tr>
</template>
