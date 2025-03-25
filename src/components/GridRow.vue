<script lang="ts" setup>
import { inject, reactive, ref } from "vue"
import type { Ref } from "vue"
import type { IPlan, Node, ViewOptions } from "@/interfaces"
import { NodeProp } from "@/enums"
import { PlanKey, ViewOptionsKey } from "@/symbols"
import {
  result,
  duration,
  formatNodeProp,
} from "@/filters"
import LevelDivider from "@/components/LevelDivider.vue"
import GridProgressBar from "@/components/GridProgressBar.vue"
import MiscDetail from "@/components/MiscDetail.vue"
import SeverityBullet from "@/components/SeverityBullet.vue"
import useNode from "@/node"
import { directive as vTippy } from "vue-tippy"
import { HelpService } from "@/services/help-service"
const helpService = new HelpService()
const getNodeTypeDescription = helpService.getNodeTypeDescription

interface Props {
  node: Node
  level: number
  isSubplan: boolean
  isLastChild: boolean
  branches: number[]
  index: number
  columns: string[]
}
const props = defineProps<Props>()

const node = reactive<Node>(props.node)
const plan = inject(PlanKey) as Ref<IPlan>
const viewOptions = inject(ViewOptionsKey) as ViewOptions

// UI flags
const activeTab = ref<string>("misc")

const {
  resultClass,
  durationClass,
  estimationClass,
  executionTimePercent,
  nodeName,
  rowsTooltip,
  timeTooltip,
  resultTooltip,
  estimationTooltip
} = useNode(plan, node, viewOptions)
const showDetails = ref<boolean>(false)

// returns the formatted prop
function formattedProp(propName: keyof typeof NodeProp) {
  const property = NodeProp[propName]
  const value = node[property]
  return formatNodeProp(property, value)
}
</script>
<template>
  <tr @click="showDetails = !showDetails" class="node">
    <td class="node-index text-secondary">
      <!-- node id -->
      <a :href="`#plan/node/${node.nodeId}`" @click.stop>
        <span class="font-weight-normal small">#{{ node.nodeId }} </span>
      </a>
    </td>
    <td
      class="text-end grid-progress-cell text-nowrap"
      v-if="columns.includes('time')"
    >
      <GridProgressBar
        :percentage="
          (node[NodeProp.ACTUAL_TIME]! /
            (plan.planStats.executionTime! ||
              plan.content[NodeProp.ACTUAL_TIME]! as number)) *
          100
        "
        :percentage2="
          ((node[NodeProp.CPU_TIME] - node[NodeProp.ACTUAL_TIME]!) /
            (plan.planStats.executionTime! ||
              plan.content[NodeProp.ACTUAL_TIME]! as number)) *
          100
        "
      ></GridProgressBar>
      <!-- time -->
      <div
        class="position-relative d-flex"
        v-tippy="{ content: timeTooltip, allowHTML: true }"
      >
        <severity-bullet
          :severity="durationClass"
          v-if="durationClass"
        ></severity-bullet>
        <span class="flex-grow-1">
          {{ duration(node[NodeProp.ACTUAL_TIME]) }}
        </span>
      </div>
      <div v-if="showDetails" class="small text-body-secondary">
        {{ duration(node[NodeProp.ACTUAL_TIME]) }}
        <br />
        <template v-if="executionTimePercent !== Infinity">
          {{ executionTimePercent }}%
        </template>
      </div>
    </td>
    <td
      class="text-end grid-progress-cell text-nowrap"
      v-if="columns.includes('rows')"
    >
      <GridProgressBar
        :percentage="
          (node[NodeProp.ACTUAL_ROWS]! / plan.planStats.maxRows) * 100
        "
      ></GridProgressBar>
      <!-- rows -->
      <div
        class="position-relative"
        v-tippy="{ content: rowsTooltip, allowHTML: true }"
      >
        {{ node[NodeProp.ACTUAL_ROWS]?.toLocaleString() }}
      </div>
    </td>
    <td
      class="text-end grid-progress-cell text-nowrap"
      v-if="columns.includes('estimation')"
    >
      <!--      <GridProgressBar-->
      <!--        :percentage="estimationPercent">-->
      <!--      </GridProgressBar>-->
      <!-- estimation -->
      <div
        v-if="node[NodeProp.EXTRA_INFO][NodeProp.ESTIMATED_ROWS] != undefined"
        v-tippy="{ content: estimationTooltip, allowHTML: true }"
      >
        <div
          class="position-relative d-flex"
          v-if="
            node[NodeProp.EXTRA_INFO][NodeProp.ESTIMATED_ROWS] !=
            node[NodeProp.ACTUAL_ROWS]
          "
        >
          <severity-bullet
            :severity="estimationClass"
            v-if="estimationClass"
          ></severity-bullet>
          <span class="flex-grow-1">
            <span
              v-html="node[NodeProp.EXTRA_INFO][NodeProp.ESTIMATED_ROWS] || 0"
            ></span>
            <span
              v-if="
                node[NodeProp.EXTRA_INFO][NodeProp.ESTIMATED_ROWS] as unknown as number <
                node[NodeProp.ACTUAL_ROWS]!
              "
            >
              ▾
            </span>
            <span
              v-if="
                node[NodeProp.EXTRA_INFO][NodeProp.ESTIMATED_ROWS] as unknown as number >
                node[NodeProp.ACTUAL_ROWS]!
              "
            >
              ▴
            </span>
          </span>
        </div>
      </div>
    </td>
    <td
      class="text-end grid-progress-cell text-nowrap"
      v-if="columns.includes('result')"
    >
      <GridProgressBar
        :percentage="
          Math.round(
            (node[NodeProp.RESULT_SET_SIZE] / plan.planStats.maxResult) * 100
          )
        "
      ></GridProgressBar>
      <!-- result -->
      <div
        class="position-relative d-flex"
        v-tippy="{ content: resultTooltip, allowHTML: true }"
      >
        <severity-bullet
          :severity="resultClass"
          v-if="resultClass"
        ></severity-bullet>
        <span class="flex-grow-1">
          {{ result(node[NodeProp.RESULT_SET_SIZE]) }}
        </span>
      </div>
    </td>
    <td
      class="text-end grid-progress-cell text-nowrap"
      v-if="columns.includes('filter')"
    ></td>
    <td
      class="node-type"
      :class="showDetails ? '' : 'text-nowrap text-truncate overflow-hidden'"
      style="max-width: 0"
    >
      <level-divider
        :isSubplan="isSubplan"
        isNode
        :isLastChild="isLastChild"
        :level="level"
        :branches="branches"
        :index="index"
      ></level-divider>
      <div class="d-inline">
        <b
          class="border border-secondary px-1 bg-light"
          style="--bs-border-opacity: 0.5"
        >
          {{ nodeName }}
        </b>

        <span class="text-body-secondary">
          <template
            v-if="
              node[NodeProp.EXTRA_INFO][NodeProp.RELATION_NAME] ||
              node[NodeProp.EXTRA_INFO][NodeProp.FUNCTION_NAME]
            "
          >
            <span class="text-secondary">on</span>
            {{ node[NodeProp.EXTRA_INFO][NodeProp.RELATION_NAME]
            }}{{ node[NodeProp.EXTRA_INFO][NodeProp.FUNCTION_NAME] }}
          </template>
          <template v-if="node[NodeProp.CTE_NAME]">
            <span class="text-reset">
              <span class="text-secondary">CTE</span>
              {{ node[NodeProp.CTE_NAME] }}
            </span>
          </template>
          <template v-if="node[NodeProp.JOIN_TYPE]">
            {{ node[NodeProp.JOIN_TYPE] }}
            <span class="text-secondary">join</span>
          </template>
          <template
            v-if="
              node[NodeProp.EXTRA_INFO][NodeProp.TABLE_INDEX] ||
              node[NodeProp.EXTRA_INFO][NodeProp.CTE_INDEX] ||
              node[NodeProp.EXTRA_INFO][NodeProp.DELIM_INDEX]
            "
          >
            <span class="text-secondary">using</span>
            {{ node[NodeProp.EXTRA_INFO][NodeProp.TABLE_INDEX] }}
            {{ node[NodeProp.EXTRA_INFO][NodeProp.CTE_INDEX] }}
            {{ node[NodeProp.EXTRA_INFO][NodeProp.DELIM_INDEX] }}
          </template>
        </span>
      </div>
      <br />
      <div
        class="plan-node position-relative detailed"
        v-if="showDetails"
        style="width: 100%"
        @click.stop
      >
        <div class="text-wrap">
          <!--          <div-->
          <!--            v-if="getNodeTypeDescription(node[NodeProp.NODE_TYPE])"-->
          <!--            class="node-description mt-1"-->
          <!--          >-->
          <!--            <span class="node-type">{{ node[NodeProp.NODE_TYPE] }} Node</span>-->
          <!--            <span-->
          <!--              v-html="getNodeTypeDescription(node[NodeProp.NODE_TYPE])"-->
          <!--            ></span>-->
          <!--          </div>-->
          <ul class="nav nav-tabs mt-1">
            <li class="nav-item">
              <a
                class="nav-link px-2 py-1"
                :class="{ active: activeTab === 'misc' }"
                @click.prevent.stop="activeTab = 'misc'"
                href=""
                >Misc</a
              >
            </li>
            <li class="nav-item">
              <a
                class="nav-link px-2 py-1"
                :class="{
                  active: activeTab === 'output',
                  disabled:
                    !node[NodeProp.EXTRA_INFO][NodeProp.PROJECTIONS] &&
                    !node[NodeProp.EXTRA_INFO][NodeProp.AGGREGATES],
                }"
                @click.prevent.stop="activeTab = 'output'"
                href=""
                >Output</a
              >
            </li>
          </ul>
          <div class="tab-content bg-white">
            <div
              class="tab-pane p-1 border border-top-0"
              :class="{ 'show active': activeTab === 'misc' }"
            >
              <!-- misc tab -->
              <misc-detail :node="node" />
            </div>
            <div
              class="tab-pane p-1 border border-top-0 overflow-auto font-monospace"
              :class="{ 'show active': activeTab === 'output' }"
              v-html="
                node[NodeProp.EXTRA_INFO][NodeProp.PROJECTIONS] ||
                node[NodeProp.EXTRA_INFO][NodeProp.AGGREGATES]
              "
              style="max-height: 200px"
              @mousewheel.stop
            ></div>
          </div>
        </div>
      </div>
    </td>
  </tr>
</template>
