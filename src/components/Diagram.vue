<script lang="ts" setup>
import _ from "lodash"
import {
  computed,
  inject,
  nextTick,
  onBeforeMount,
  onMounted,
  provide,
  reactive,
  ref,
  watch,
} from "vue"
import type { Ref } from "vue"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons"
import { BufferLocation, NodeProp, Metric } from "../enums"
import { HelpService, scrollChildIntoParentView } from "@/services/help-service"
import type { IPlan, Node } from "@/interfaces"
import { HighlightedNodeIdKey, PlanKey, SelectNodeKey } from "@/symbols"
import DiagramRow from "@/components/DiagramRow.vue"

import { directive as vTippy } from "vue-tippy"
import tippy, { createSingleton } from "tippy.js"
import type { CreateSingletonInstance, Instance } from "tippy.js"

const helpService = new HelpService()
const getHelpMessage = helpService.getHelpMessage

type Row = [number, Node, boolean, number[]]

const plan = inject(PlanKey) as Ref<IPlan>

const container = ref(null) // The container element

const selectNode = inject(SelectNodeKey)
if (!selectNode) {
  throw new Error(`Could not resolve ${SelectNodeKey.description}`)
}
const highlightedNodeId = inject(HighlightedNodeIdKey)

// The main plan + init plans (all flatten)
let plans: Row[][] = [[]]
let tippyInstances: Instance[] = []
let tippySingleton!: CreateSingletonInstance

const viewOptions = reactive({
  metric: Metric.time,
  buffersMetric: BufferLocation.shared,
})

onBeforeMount((): void => {
  const savedOptions = localStorage.getItem("diagramViewOptions")
  if (savedOptions) {
    _.assignIn(viewOptions, JSON.parse(savedOptions))
  }
  if (plan.value.content[NodeProp.CPU_TIME] !== undefined) {
    // plan is analyzed
    flatten(plans[0], 0, plan.value.content[NodeProp.PLANS][0], true, [])
  } else {
    // plan is not analyzed
    flatten(plans[0], 0, plan.value.content, true, [])
  }
})

onMounted((): void => {
  loadTooltips()
})

watch(viewOptions, onViewOptionsChanged)

function onViewOptionsChanged() {
  localStorage.setItem("diagramViewOptions", JSON.stringify(viewOptions))
  nextTick(loadTooltips)
}

function loadTooltips(): void {
  if (tippySingleton) {
    tippySingleton.destroy()
  }
  _.each(tippyInstances, (instance) => {
    instance.destroy()
  })
  tippyInstances = tippy(".diagram tr.node")
  tippySingleton = createSingleton(tippyInstances, {
    delay: 100,
    allowHTML: true,
  })
}

function flatten(
  output: Row[],
  level: number,
  node: Node,
  isLast: boolean,
  branches: number[]
) {
  // [level, node, isLastSibbling, branches]
  output.push([level, node, isLast, _.concat([], branches)])
  if (!isLast) {
    branches.push(level)
  }

  _.each(node[NodeProp.PLANS], (subnode) => {
    flatten(
      output,
      level + 1,
      subnode,
      subnode === _.last(node[NodeProp.PLANS]),
      branches
    )
  })
  if (!isLast) {
    branches.pop()
  }
}

function scrollTo(el: Element) {
  if (!container.value) {
    return
  }
  scrollChildIntoParentView(container.value, el, false)
}

provide("scrollTo", scrollTo)
</script>

<template>
  <div class="diagram">
    <div class="flex-shrink-0">
      <div class="text-center my-1">
        <div class="btn-group btn-group-xs">
          <button
            class="btn btn-outline-secondary"
            :class="{ active: viewOptions.metric === Metric.time }"
            v-on:click="viewOptions.metric = Metric.time"
          >
            time
          </button>
          <button
            class="btn btn-outline-secondary"
            :class="{ active: viewOptions.metric === Metric.rows }"
            v-on:click="viewOptions.metric = Metric.rows"
          >
            rows
          </button>
          <button
            class="btn btn-outline-secondary"
            :class="{ active: viewOptions.metric === Metric.result }"
            v-on:click="viewOptions.metric = Metric.result"
          >
            result
          </button>
        </div>
      </div>
    </div>
    <div class="overflow-auto flex-grow-1" ref="container">
      <table
        class="m-1"
        v-if="true"
        :class="{ highlight: !!highlightedNodeId }"
      >
        <tbody v-for="(flat, index) in plans" :key="index">
          <tr v-if="index === 0 && plans.length > 1">
            <th colspan="3" class="subplan">Main Query Plan</th>
          </tr>
          <template v-for="(row, index) in flat" :key="index">
            <diagram-row
              :node="row[1]"
              :isSubplan="false /*!!row[1][NodeProp.SUBPLAN_NAME]*/"
              :isLastChild="!!row[2]"
              :level="row[0]"
              :branches="row[3]"
              :index="index"
              :viewOptions="viewOptions"
            ></diagram-row>
          </template>
        </tbody>
      </table>
      <div class="p-2 text-center text-secondary" v-else>
        <em> No data available </em>
      </div>
    </div>
  </div>
</template>
