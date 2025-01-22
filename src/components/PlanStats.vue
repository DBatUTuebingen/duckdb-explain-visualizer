<script lang="ts" setup>
import _, { size } from "lodash"
import type { Ref } from "vue"
import { PlanKey } from "@/symbols"
import { computed, inject, ref } from "vue"
import type { IPlan, ITrigger, Node } from "@/interfaces"
import { HelpService } from "@/services/help-service"
import { bytes, duration, durationClass, rows } from "@/filters"
import { directive as vTippy } from "vue-tippy"
import { NodeProp } from "../enums"
import { formatNodeProp } from "@/filters"

import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { faCaretDown, faInfoCircle } from "@fortawesome/free-solid-svg-icons"

const helpService = new HelpService()
const getHelpMessage = helpService.getHelpMessage
const plan = inject(PlanKey) as Ref<IPlan>

</script>

<template>
  <div
    class="plan-stats flex-shrink-0 d-flex border-bottom border-top align-items-center"
    v-if="plan"
  >
    <div class="d-inline-block px-2">
      Execution time:
      <template v-if="!plan.planStats.executionTime">
        <span class="text-secondary">
          N/A
          <FontAwesomeIcon
            :icon="faInfoCircle"
            class="cursor-help"
            v-tippy="getHelpMessage('missing execution time')"
          ></FontAwesomeIcon>
        </span>
      </template>
      <template v-else>
        <span
          class="stat-value"
          v-html="duration(plan.planStats.executionTime)"
        ></span>
      </template>
    </div>
    <div class="d-inline-block px-2">
      Blocked Thread Time:
      <template v-if="!plan.planStats.blockedThreadTime">
        <span class="text-secondary">
          N/A
          <FontAwesomeIcon
            :icon="faInfoCircle"
            class="cursor-help"
            v-tippy="getHelpMessage('missing blocked thread time')"
          ></FontAwesomeIcon>
        </span>
      </template>
      <template v-else>
        <span
          class="stat-value"
          v-html="duration(plan.planStats.blockedThreadTime)"
        ></span>
      </template>
    </div>
    <div class="d-inline-block px-2">
      Latency:
      <template v-if="!plan.planStats.latency">
        <span class="text-secondary">
          N/A
          <FontAwesomeIcon
            :icon="faInfoCircle"
            class="cursor-help"
            v-tippy="getHelpMessage('missing latency')"
          ></FontAwesomeIcon>
        </span>
      </template>
      <template v-else>
        <span
          class="stat-value"
          v-html="duration(plan.planStats.latency)"
        ></span>
      </template>
    </div>
    <div class="d-inline-block px-2">
      Rows returned:
      <template v-if="!plan.planStats.rowsReturned">
        <span class="text-secondary">
          N/A
          <FontAwesomeIcon
            :icon="faInfoCircle"
            class="cursor-help"
            v-tippy="getHelpMessage('missing returned rows')"
          ></FontAwesomeIcon>
        </span>
      </template>
      <template v-else>
        <span
          class="stat-value"
          v-html="rows(plan.planStats.rowsReturned)"
        ></span>
      </template>
    </div>
    <div class="d-inline-block px-2">
      Result size:
      <template v-if="!plan.planStats.resultSize">
        <span class="text-secondary">
          N/A
          <FontAwesomeIcon
            :icon="faInfoCircle"
            class="cursor-help"
            v-tippy="getHelpMessage('missing result size')"
          ></FontAwesomeIcon>
        </span>
      </template>
      <template v-else>
        <span
          class="stat-value"
          v-html="bytes(plan.planStats.resultSize)"
        ></span>
      </template>
    </div>
<!--    <div class="d-inline-block border-start px-2">-->
<!--      Planning time:-->
<!--      <template v-if="!plan.planStats.planningTime">-->
<!--        <span class="text-secondary">-->
<!--          N/A-->
<!--          <FontAwesomeIcon-->
<!--            :icon="faInfoCircle"-->
<!--            class="cursor-help"-->
<!--            v-tippy="getHelpMessage('missing planning time')"-->
<!--          ></FontAwesomeIcon>-->
<!--        </span>-->
<!--      </template>-->
<!--      <template v-else>-->
<!--        <span class="stat-value">-->
<!--          <span-->
<!--            :class="-->
<!--                      'mb-0 p-0 px-1 alert ' +-->
<!--                      planningTimeClass(-->
<!--                        (plan.planStats.planningTime / (plan.planStats.executionTime as number)) *-->
<!--                         100-->
<!--                      )-->
<!--                    "-->
<!--            v-html="duration(plan.planStats.planningTime)"-->
<!--          ></span>-->
<!--        </span>-->
<!--      </template>-->
<!--    </div>-->
  </div>
</template>
