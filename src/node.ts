// Composable for PlanNode and PlanNodeDetail components
import _ from "lodash"
import { computed, onBeforeMount, ref, watch } from "vue"
import type { Ref } from "vue"
import type { IPlan, Node, ViewOptions } from "@/interfaces"
import { NodeProp, HighlightType } from "@/enums"
import { cost, duration, rows } from "@/filters"
import { numberToColorHsl } from "@/services/color-service"

export default function useNode(
  plan: Ref<IPlan>,
  node: Node,
  viewOptions: ViewOptions
) {
  const executionTimePercent = ref<number>(NaN)
  const resultPercent = ref<number>(NaN)
  const rowsPercent = ref<number>(NaN)
  const estimationPercent = ref<number>(NaN)
  const barWidth = ref<number>(0)
  const highlightValue = ref<string | null>(null)

  onBeforeMount(() => {
    calculateBar()
    calculateDuration()
    calculateResult()
    calculateRows()
  })

  watch(() => viewOptions.highlightType, calculateBar)

  function calculateBar(): void {
    let value: number | undefined
    switch (viewOptions.highlightType) {
      case HighlightType.DURATION:
        value = node[NodeProp.ACTUAL_TIME]
        if (value === undefined) {
          highlightValue.value = null
          break
        }
        barWidth.value = Math.round(
          (value / (plan.value.planStats.maxDuration as number)) * 100
        )
        highlightValue.value = duration(value)
        break
      case HighlightType.ROWS:
        value = node[NodeProp.ACTUAL_ROWS]
        if (value === undefined) {
          highlightValue.value = null
          break
        }
        barWidth.value =
          Math.round(
            (value / (plan.value.planStats.maxRows as number)) * 100
          ) || 0
        highlightValue.value = rows(value)
        break
      case HighlightType.RESULT:
        value = node[NodeProp.RESULT_SET_SIZE]
        if (value === undefined) {
          highlightValue.value = null
          break
        }
        barWidth.value = Math.round(
          (value / (plan.value.planStats.maxResult as number)) * 100
        )
        highlightValue.value = cost(value)
        break
    }
  }

  const barColor = computed((): string => {
    return numberToColorHsl(barWidth.value)
  })

  const nodeName = computed((): string => {
    let nodeName = ""
    nodeName += node[NodeProp.NODE_TYPE] ?? node[NodeProp.NODE_TYPE_EXPLAIN]
    return nodeName
  })

  function calculateDuration() {
    // use the first node total time if plan execution time is not available
    const executionTime =
      (plan.value.planStats.executionTime as number) ||
      (plan.value.content?.[NodeProp.CPU_TIME] as number)
    const duration = node[NodeProp.ACTUAL_TIME] as number
    executionTimePercent.value = _.round((duration / executionTime) * 100)
  }

  function calculateResult() {
    const maxResult = plan.value.content.maxResult as number
    const result = node[NodeProp.RESULT_SET_SIZE] as number
    resultPercent.value = _.round((result / maxResult) * 100)
  }

  function calculateRows() {
    const maxRows = plan.value.content.maxRows as number
    const rows = node[NodeProp.ACTUAL_ROWS] as number
    rowsPercent.value = _.round((rows / maxRows) * 100)
  }

  const durationClass = computed(() => {
    let c
    const i = executionTimePercent.value
    if (i > 90) {
      c = 4
    } else if (i > 50) {
      c = 3
    }
    if (c) {
      return "c-" + c
    }
    return false
  })

  const rowsClass = computed(() => {
    let c
    const i = rowsPercent.value
    if (i > 90) {
      c = 4
    } else if (i > 50) {
      c = 3
    }
    if (c) {
      return "c-" + c
    }
    return false
  })

  const resultClass = computed(() => {
    let c
    const i = resultPercent.value
    if (i > 90) {
      c = 4
    } else if (i > 50) {
      c = 3
    }
    if (c) {
      return "c-" + c
    }
    return false
  })

  const estimationClass = computed(() => {
    let c
    const i = estimationPercent.value
    if (i > 90) {
      c = 4
    } else if (i > 50) {
      c = 3
    }
    if (c) {
      return "c-" + c
    }
    return false
  })

  const isNeverExecuted = computed((): boolean => {
    return (
      !!plan.value.planStats.executionTime &&
      !node[NodeProp.ACTUAL_TIME] &&
      !node[NodeProp.ACTUAL_ROWS]
    )
  })

  const timeTooltip = computed((): string => {
    return [
      "Duration: <br>Actual Time: ",
      duration(node[NodeProp.ACTUAL_TIME]),
      ", CPU Time: ",
      duration(node[NodeProp.CPU_TIME]),
    ].join("")
  })

  const rowsTooltip = computed((): string => {
    return ["Rows: ", rows(node[NodeProp.ACTUAL_ROWS] as number)].join("")
  })

  const resultTooltip = computed((): string => {
    return ["Result: ", rows(node[NodeProp.RESULT_SET_SIZE] as number)].join("")
  })

  const estimationTooltip = computed((): string => {
    return [
      "Estimated: ",
      rows(
        node[NodeProp.EXTRA_INFO][NodeProp.ESTIMATED_ROWS] as unknown as number
      ),
    ].join("")
  })

  return {
    barColor,
    barWidth,
    resultClass,
    resultTooltip,
    durationClass,
    rowsClass,
    estimationClass,
    executionTimePercent,
    highlightValue,
    isNeverExecuted,
    nodeName,
    rowsTooltip,
    timeTooltip,
    estimationTooltip,
  }
}
