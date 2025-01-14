<script lang="ts" setup>
import { inject, reactive } from "vue"
import type { Ref } from "vue"
import { directive as vTippy } from "vue-tippy"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import {
  faClock,
  faMemory,
  faThumbsDown
} from "@fortawesome/free-solid-svg-icons"
import useNode from "@/node"
import type { IPlan, Node, ViewOptions } from "@/interfaces"
import { PlanKey, ViewOptionsKey } from "@/symbols"
interface Props {
  node: Node
}
const props = defineProps<Props>()
const node = reactive<Node>(props.node)
const plan = inject(PlanKey) as Ref<IPlan>
const viewOptions = inject(ViewOptionsKey) as ViewOptions

const {
  resultClass,
  durationClass,
  rowsClass
} = useNode(plan, node, viewOptions)
</script>
<template>
  <span
    v-if="durationClass"
    :class="'p-0  d-inline-block mb-0 ms-1 text-nowrap alert ' + durationClass"
    v-tippy="'Slow'"
    ><FontAwesomeIcon fixed-width :icon="faClock"></FontAwesomeIcon>
  </span>
  <span
    v-if="resultClass"
    :class="'p-0  d-inline-block mb-0 ms-1 text-nowrap alert ' + resultClass"
    v-tippy="'Result is big'"
    ><FontAwesomeIcon fixed-width :icon="faMemory"></FontAwesomeIcon
  ></span>
  <span
    v-if="rowsClass"
    :class="
      'p-0  d-inline-block mb-0 ms-1 text-nowrap alert ' + rowsClass
    "
    v-tippy="'Many rows'"
    ><FontAwesomeIcon fixed-width :icon="faThumbsDown"></FontAwesomeIcon
  ></span>
</template>
