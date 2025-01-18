<script lang="ts" setup>
import _ from "lodash"
import { computed, inject, onBeforeMount, onMounted } from "vue"
import type { Ref } from "vue"
import type { IPlan, Node, Row } from "@/interfaces"
import GridRow from "@/components/GridRow.vue"
import { PlanKey } from "@/symbols"
import { NodeProp } from "../enums"
import LevelDivider from "@/components/LevelDivider.vue"
const plan = inject(PlanKey) as Ref<IPlan>

let plans: Row[][] = [[]]

onBeforeMount((): void => {
  flatten(plans[0], 0, plan.value.content, true, [])

  _.each(plan.value.ctes, (cte) => {
    const flat: Row[] = []
    flatten(flat, 0, cte, true, [])
    plans.push(flat)
  })
})

onMounted((): void => {
  localStorage.setItem("gridIsNotNew", "true")
})

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

function isCTE(node: Node): boolean {
  return _.startsWith(node[NodeProp.EXTRA_INFO][NodeProp.CTE_NAME], "CTE")
}

const hasTime = computed((): boolean => {
  return _.some(plans, (plan: Row[]) => {
    return _.some(plan, (row: Row) => {
      return row[1][NodeProp.ACTUAL_TIME] || 0 > 1
    })
  })
})

const hasRows = computed((): boolean => {
  return _.some(plans, (plan: Row[]) => {
    return _.some(plan, (row: Row) => {
      return row[1][NodeProp.ACTUAL_ROWS] || 0 > 1
    })
  })
})

const hasEstimation = computed((): boolean => {
  return _.some(plans, (plan: Row[]) => {
    return _.some(plan, (row: Row) => {
      return row[1][NodeProp.EXTRA_INFO][NodeProp.ESTIMATED_ROWS] || 0 > 1
    })
  })
})

const hasResult = computed((): boolean => {
  return _.some(plans, (plan: Row[]) => {
    return _.some(plan, (row: Row) => {
      return row[1][NodeProp.RESULT_SET_SIZE] > 1
    })
  })
})

const hasFilter = computed((): boolean => {
  return _.some(plans, (plan: Row[]) => {
    return _.some(plan, (row: Row) => {
      return row[1][NodeProp.NODE_TYPE]?.includes("FILTER")
    })
  })
})

const columns = computed<string[]>(() => {
  const cols = []
  if (hasTime.value) {
    cols.push("time")
  }
  if (hasRows.value) {
    cols.push("rows")
  }
  if (hasEstimation.value) {
    cols.push("estimation")
  }
  if (hasResult.value) {
    cols.push("result")
  }
  if (hasFilter.value) {
    cols.push("filter")
  }
  return cols
})

</script>

<template>
  <div>
    <table class="table table-sm table-hover">
      <thead class="table-secondary sticky-top" style="z-index: 2">
        <tr>
          <th class="text-center"></th>
          <th class="text-center" v-if="hasTime">time</th>
          <th class="text-center" v-if="hasRows">rows</th>
          <th class="text-center" v-if="hasEstimation">estim</th>
          <th class="text-center" v-if="hasResult">result</th>
          <th class="text-center" v-if="hasFilter">filter</th>
          <th style="width: 100%"></th>
        </tr>
      </thead>
      <tbody v-for="(flat, index) in plans" :key="index">
        <template v-for="(row, index) in flat" :key="index">
          <tr v-if="row[1][NodeProp.EXTRA_INFO][NodeProp.CTE_NAME]">
            <td class="bg-light" :colspan="1 + columns.length"></td>
            <td
              class="plan pr-2 bg-light"
              :class="{ 'font-weight-bold': isCTE(row[1]) }"
              :colspan="columns.length"
            >
              <level-divider
                :isSubplan="!!row[1][NodeProp.EXTRA_INFO][NodeProp.CTE_NAME]"
                :isLastChild="!!row[2]"
                :level="row[0]"
                :branches="row[3]"
                :index="index"
              ></level-divider>
              <b class="fst-italic text-reset">
                {{ row[1][NodeProp.EXTRA_INFO][NodeProp.CTE_NAME] }}
              </b>
            </td>
          </tr>
          <grid-row
            :node="row[1]"
            :isSubplan="!!row[1][NodeProp.EXTRA_INFO][NodeProp.CTE_NAME]"
            :isLastChild="!!row[2]"
            :level="row[0]"
            :branches="row[3]"
            :index="index"
            :columns="columns"
          ></grid-row>
        </template>
      </tbody>
    </table>
  </div>
</template>
