<script lang="ts" setup>
import { inject, nextTick, onMounted, provide, reactive, ref, watch } from "vue"
import type { Ref } from "vue"
import PlanNodeDetail from "@/components/PlanNodeDetail.vue"
import NodeBadges from "@/components/NodeBadges.vue"
import type { IPlan, Node, ViewOptions } from "@/interfaces"
import {
  HighlightedNodeIdKey,
  PlanKey,
  SelectedNodeIdKey,
  SelectNodeKey,
  ViewOptionsKey,
} from "@/symbols"
import { keysToString } from "@/filters"
import { HighlightType, NodeProp } from "@/enums"
import { findNodeBySubplanName } from "@/services/help-service"
import useNode from "@/node"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import {
  faChevronDown,
  faChevronUp,
  faSearch,
} from "@fortawesome/free-solid-svg-icons"

const outerEl = ref<Element | null>(null) // The outer Element, useful for CTE and subplans

const selectedNodeId = inject(SelectedNodeIdKey)
if (!selectedNodeId) {
  throw new Error(`Could not resolve ${SelectedNodeIdKey.description}`)
}
const highlightedNodeId = inject(HighlightedNodeIdKey)
const selectNode = inject(SelectNodeKey)
if (!selectNode) {
  throw new Error(`Could not resolve ${SelectNodeKey.description}`)
}
const viewOptions = inject(ViewOptionsKey) as ViewOptions

interface Props {
  node: Node
}
const props = defineProps<Props>()

const showDetails = ref<boolean>(false)

const node = reactive<Node>(props.node)
const plan = inject(PlanKey) as Ref<IPlan>
const updateNodeSize =
  inject<(node: Node, size: [number, number]) => null>("updateNodeSize")

const {
  nodeName,
  barWidth,
  barColor,
  highlightValue,
  isNeverExecuted
} = useNode(plan, node, viewOptions)

onMounted(async () => {
  updateSize(node)
})

function updateSize(node: Node) {
  const rect = outerEl.value?.getBoundingClientRect()
  if (rect) {
    updateNodeSize?.(node, [rect.width, rect.height])
  }
}
provide("updateSize", updateSize)

watch(showDetails, () => {
  window.setTimeout(() => updateSize(node), 1)
})

watch(viewOptions, () => {
  // Using nextTick has the same effect as a debounce making all nodes
  // size to be updated all at once
  nextTick(() => {
    updateSize(node)
  })
})

watch(selectedNodeId, () => {
  if (selectedNodeId.value == node.nodeId) {
    showDetails.value = true
  }
})

function centerCte() {
  const cteNode = findNodeBySubplanName(
    plan.value,
    node[NodeProp.EXTRA_INFO][NodeProp.CTE_NAME] as string
  )
  cteNode && selectNode?.(cteNode.nodeId, true)
}
</script>

<template>
  <div ref="outerEl" @mousedown.stop>
    <div
      :class="[
        'text-start plan-node',
        {
          detailed: showDetails,
          'never-executed': isNeverExecuted,
          selected: selectedNodeId == node.nodeId,
          highlight: highlightedNodeId == node.nodeId,
        },
      ]"
    >
      <div
        class="plan-node-body card"
        @mouseenter="highlightedNodeId = node.nodeId"
        @mouseleave="highlightedNodeId = undefined"
      >
        <div class="card-body header no-focus-outline">
          <header class="mb-0 d-flex justify-content-between">
            <h4
              class="text-body overflow-hidden btn btn-light text-start py-0 px-1"
              @click.prevent.stop="showDetails = !showDetails"
            >
              <span class="text-secondary">
                <FontAwesomeIcon
                  fixed-width
                  :icon="faChevronUp"
                  v-if="showDetails"
                ></FontAwesomeIcon>
                <FontAwesomeIcon
                  fixed-width
                  :icon="faChevronDown"
                  v-else
                ></FontAwesomeIcon>
              </span>
              {{ nodeName }}
            </h4>
            <div class="text-nowrap">
              <node-badges :node="node" />
              <a
                class="fw-normal small ms-1"
                href=""
                @click.prevent.stop="selectNode(node.nodeId, true)"
              >
                #{{ node.nodeId }}
              </a>
            </div>
          </header>
          <div class="text-start font-monospace">
            <div
              v-if="node[NodeProp.EXTRA_INFO][NodeProp.RELATION_NAME]"
              :class="{ 'line-clamp-2': !showDetails }"
            >
              <span class="text-secondary">on </span>
              {{ node[NodeProp.EXTRA_INFO][NodeProp.RELATION_NAME] }}
            </div>
            <div
              v-if="node[NodeProp.EXTRA_INFO][NodeProp.FUNCTION]"
              :class="{ 'line-clamp-2': !showDetails }"
            >
              <span class="text-secondary">with </span>
              {{ node[NodeProp.EXTRA_INFO][NodeProp.FUNCTION] }}
            </div>
            <div
              v-if="node[NodeProp.EXTRA_INFO][NodeProp.GROUPS]"
              :class="{ 'line-clamp-2': !showDetails }"
            >
              <span class="text-secondary">group by</span>
              <span
                v-html="keysToString(node[NodeProp.EXTRA_INFO][NodeProp.GROUPS] as string)"
              ></span>
            </div>
            <div v-if="node[NodeProp.EXTRA_INFO][NodeProp.JOIN_TYPE]">
              {{ node[NodeProp.EXTRA_INFO][NodeProp.JOIN_TYPE] }}
              <span class="text-secondary">join</span>
            </div>
            <div
              v-if="node[NodeProp.EXTRA_INFO][NodeProp.PROJECTIONS]"
              :class="{ 'line-clamp-2': !showDetails }"
            >
              <span class="text-secondary">projects</span>
              {{
                keysToString(node[NodeProp.EXTRA_INFO][NodeProp.PROJECTIONS]!)
              }}
            </div>
            <div v-if="node[NodeProp.EXTRA_INFO][NodeProp.FUNCTION_NAME]">
              {{ node[NodeProp.EXTRA_INFO][NodeProp.FUNCTION_NAME] }}
            </div>
            <div
              v-if="node[NodeProp.EXTRA_INFO][NodeProp.CONDITIONS]"
              :class="{ 'line-clamp-2': !showDetails }"
            >
              <span class="text-secondary">on</span>
              <span
                v-html="keysToString(node[NodeProp.EXTRA_INFO][NodeProp.CONDITIONS] as string)"
              ></span>
            </div>
            <div
              v-if="node[NodeProp.EXTRA_INFO][NodeProp.FILTER]"
              :class="{ 'line-clamp-2': !showDetails }"
            >
              <span class="text-secondary">on</span>
              <span
                v-html="keysToString(node[NodeProp.EXTRA_INFO][NodeProp.FILTER] as string)"
              ></span>
            </div>
            <div v-if="node[NodeProp.EXTRA_INFO][NodeProp.CTE_NAME]">
              <a class="text-reset" href="" @click.prevent.stop="centerCte">
                <FontAwesomeIcon
                  :icon="faSearch"
                  class="text-secondary"
                ></FontAwesomeIcon>
                <span class="text-secondary">CTE</span>
                {{ node[NodeProp.EXTRA_INFO][NodeProp.CTE_NAME] }}
              </a>
            </div>
          </div>

          <div
            v-if="
              viewOptions.highlightType !== HighlightType.NONE &&
              highlightValue !== null
            "
          >
            <div class="progress node-bar-container" style="height: 5px">
              <div
                class="progress-bar"
                role="progressbar"
                :style="{
                  width: barWidth + '%',
                  'background-color': barColor,
                }"
                aria-valuenow="0"
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>
            <span class="node-bar-label">
              <span class="text-secondary"
                >{{ viewOptions.highlightType }}:</span
              >
              <span v-html="highlightValue"></span>
            </span>
          </div>
        </div>
        <plan-node-detail :node="node" v-if="showDetails"></plan-node-detail>
      </div>
    </div>
  </div>
</template>
