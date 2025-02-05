<script lang="ts" setup>
import { inject, onBeforeMount, reactive, ref, watch } from "vue"
import type { Ref } from "vue"
import { directive as vTippy } from "vue-tippy"
import type { IPlan, Node, ViewOptions } from "@/interfaces"
import { HelpService } from "@/services/help-service"
import { formatNodeProp } from "@/filters"
import { NodeProp } from "@/enums"
import useNode from "@/node"
import MiscDetail from "@/components/MiscDetail.vue"
import { PlanKey, ViewOptionsKey } from "@/symbols"
import _ from "lodash"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import {
  faAlignJustify,
  faArrowDown,
  faArrowUp,
  faClock,
  faDollarSign,
  faExchangeAlt,
  faFilter,
  faInfoCircle,
  faUndo,
} from "@fortawesome/free-solid-svg-icons"

const viewOptions = inject(ViewOptionsKey) as ViewOptions

interface Props {
  node: Node
}
const props = defineProps<Props>()

const updateSize = inject<(node: Node) => null>("updateSize")

const node = reactive<Node>(props.node)
const plan = inject(PlanKey) as Ref<IPlan>
const nodeProps = ref<
  {
    key: keyof typeof NodeProp
    value: unknown
  }[]
>()

// UI flags
const activeTab = ref<string>("general")

const helpService = new HelpService()
const getNodeTypeDescription = helpService.getNodeTypeDescription

const {
  resultClass,
  durationClass,
  // estimationClass,
  executionTimePercent,
  rowsClass
} = useNode(plan, node, viewOptions)

onBeforeMount(() => {
  calculateProps()
})

// create an array of node propeties so that they can be displayed in the view
function calculateProps() {
  nodeProps.value = _.chain(node)
    .omit(NodeProp.PLANS)
    .map((value, key) => {
      return { key: key as keyof typeof NodeProp, value }
    })
    .value()
}

// returns the formatted prop
function formattedProp(propName: keyof typeof NodeProp) {
  const property = NodeProp[propName]
  const value = node[property]
  return formatNodeProp(property, value)
}

watch(activeTab, () => {
  window.setTimeout(() => updateSize && updateSize(node), 1)
})
</script>

<template>
  <div class="card-header border-top">
    <div
      v-if="getNodeTypeDescription(node[NodeProp.NODE_TYPE] ?? node[NodeProp.NODE_TYPE_EXPLAIN])"
      class="node-description"
    >
      <span class="node-type">{{ node[NodeProp.NODE_TYPE] ?? node[NodeProp.NODE_TYPE_EXPLAIN] }} Node</span>
      <span v-html="getNodeTypeDescription(node[NodeProp.NODE_TYPE] ?? node[NodeProp.NODE_TYPE_EXPLAIN])"></span>
    </div>
    <ul class="nav nav-tabs card-header-tabs">
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === 'general' }"
          @click.prevent.stop="activeTab = 'general'"
          href=""
          >General</a
        >
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{
            active: activeTab === 'output',
            disabled: !node[NodeProp.EXTRA_INFO][NodeProp.PROJECTIONS]
                      && !node[NodeProp.EXTRA_INFO][NodeProp.AGGREGATES]
          }"
          @click.prevent.stop="activeTab = 'output'"
          href=""
          >Output</a
        >
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === 'misc' }"
          @click.prevent.stop="activeTab = 'misc'"
          href=""
          >Misc</a
        >
      </li>
    </ul>
  </div>
  <div class="card-body tab-content">
    <div class="tab-pane" :class="{ 'show active': activeTab === 'general' }">
      <!-- general tab -->
      <div v-if="true">
        <FontAwesomeIcon
          fixed-width
          :icon="faClock"
          class="text-secondary"
        ></FontAwesomeIcon>
        <b>Timing:</b>
        <span
          class="p-0 px-1 rounded alert"
          :class="durationClass"
          v-html="formattedProp('ACTUAL_TIME')"
        ></span>
        <template v-if="executionTimePercent !== Infinity">
          |
          <strong>{{ executionTimePercent }}</strong
          ><span class="text-secondary">%</span>
        </template>
      </div>
      <div>
        <FontAwesomeIcon
          fixed-width
          :icon="faAlignJustify"
          class="text-secondary"
        ></FontAwesomeIcon>
        <b>Rows:</b>
        <span class="px-1">{{ formattedProp("ACTUAL_ROWS") }}</span>
        <span class="text-secondary" v-if="node[NodeProp.EXTRA_INFO][NodeProp.ESTIMATED_ROWS]"
          >(Estimated: {{ node[NodeProp.EXTRA_INFO][NodeProp.ESTIMATED_ROWS] }})</span>
        <span class="text-secondary">(Scanned: {{ formattedProp("OPERATOR_ROWS_SCANNED") }})</span>
      </div>
    </div>
    <!-- output tab -->
    <div
      class="tab-pane overflow-auto font-monospace"
      :class="{ 'show active': activeTab === 'output' }"
      v-html="node[NodeProp.EXTRA_INFO][NodeProp.PROJECTIONS] || node[NodeProp.EXTRA_INFO][NodeProp.AGGREGATES]"
      style="max-height: 200px"
      @mousewheel.stop
    ></div>
    <!-- misc tab -->
    <div class="tab-pane" :class="{ 'show active': activeTab === 'misc' }">
      <misc-detail :node="node" />
    </div>
  </div>
</template>
