<script lang="ts" setup>
import { inject, ref, onMounted } from "vue"

import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"

import { time_ago } from "../utils"
import MainLayout from "../layouts/MainLayout.vue"
import Plan from "@/components/Plan.vue"
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons"
import {
  plan1_source,
  plan1_source_json,
  plan1_query,
  plan2_source,
  plan2_query,
  plan3_source,
  plan3_query,
  plan4_source,
  plan5_source,
  plan5_query,
  plan6_source,
  plan7_source,
  plan7_query,
  plan8_source,
  plan9_source,
  plan9_query,
  plan_parallel_source,
  plan_parallel_2_source,
  plan_parallel_2_query,
  plan_trigger_source,
  plan_trigger_query,
  plan_trigger_2_source,
  plan_trigger_2_query,
} from "../samples.ts"

import idb from "../idb"

const setPlanData = inject("setPlanData")

const planInput = ref<string>("")
const queryInput = ref<string>("")
const queryName = ref<string>("")
const draggingPlan = ref<boolean>(false)
const draggingQuery = ref<boolean>(false)
const savedPlans = ref<Plan[]>()

interface Sample extends Array<string> {
  0: string
  1: string
  2: string
}

const samples = ref<Sample[]>([
  ["NO SAMPLES YET", null, null],
  // ["Example 1 TEXT", plan1_source, plan1_query],
  // ["Example 1 JSON", plan1_source_json, plan1_query],
  // ["Example 2", plan2_source, plan2_query],
  // ["Example 3", plan3_source, plan3_query],
  // ["Example 5", plan5_source, plan5_query],
  // ["With subplan", plan6_source, ""],
  // ["With Buffers", plan7_source, plan7_query],
  // ["With CTE", plan9_source, plan9_query],
  // ["With CTEs", plan4_source, ""],
  // ["Very large plan", plan8_source, ""],
  // ["With trigger", plan_trigger_2_source, plan_trigger_2_query],
  // ["With trigger (plain text)", plan_trigger_source, plan_trigger_query],
  // ["Parallel (verbose)", plan_parallel_source, ""],
  // ["Parallel (4 workers)", plan_parallel_2_source, plan_parallel_2_query],
])

function submitPlan() {
  let newPlan: Plan = ["", "", ""]
  newPlan[0] =
    queryName.value ||
    "New Plan - " +
      new Date().toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "medium",
      })
  newPlan[1] = planInput.value
  newPlan[2] = queryInput.value
  newPlan[3] = new Date().toISOString()
  savePlanData(newPlan)

  setPlanData(...newPlan)
}

async function savePlanData(sample: Plan) {
  await idb.savePlan(sample)
}

onMounted(() => {
  const textAreas = document.getElementsByTagName("textarea")
  Array.prototype.forEach.call(textAreas, (elem: HTMLInputElement) => {
    elem.placeholder = elem.placeholder.replace(/\\n/g, "\n")
  })
  const noHashURL = window.location.href.replace(/#.*$/, "")
  window.history.replaceState("", document.title, noHashURL)
  loadPlans()
})

async function loadPlans() {
  const plans = await idb.getPlans()
  savedPlans.value = plans.slice().reverse()
}

function loadPlan(plan?: Plan) {
  if (!plan) {
    return
  }

  queryName.value = plan[0]
  planInput.value = plan[1]
  queryInput.value = plan[2]
}

function openPlan(plan: Plan) {
  setPlanData(plan[0], plan[1], plan[2])
}

function editPlan(plan: Plan) {
  loadPlan(plan)
}

async function deletePlan(plan: Plan) {
  await idb.deletePlan(plan)
  loadPlans()
}

function handleDrop(event: DragEvent) {
  const input = event.srcElement
  if (!(input instanceof HTMLTextAreaElement)) {
    return
  }
  draggingPlan.value = false
  draggingQuery.value = false
  if (!event.dataTransfer) {
    return
  }
  const file = event.dataTransfer.files[0]
  const reader = new FileReader()
  reader.onload = () => {
    if (reader.result instanceof ArrayBuffer) {
      return
    }
    input.value = reader.result || ""
    input.dispatchEvent(new Event("input"))
  }
  reader.readAsText(file)
}
</script>

<template>
  <main-layout>
    <div class="container">
      <div class="alert alert-warning">
        This is the demo application for the
        <a href="https://github.com/DBatUTuebingen/duckdb-explain-visualizer"
          >duckdb-explain-visualizer</a
        >. It is serverless and only stores your plans local.
        <br />
      </div>
      <div class="row mb-3">
        <div class="col d-flex">
          <div class="text-secondary">
            Generate a json query plan using the following lines in any terminal
            running the DuckDB CLI: <br />
            <code>PRAGMA enable_profiling = 'json';</code> <br />
            <code>PRAGMA profiling_output = '/path/to/file.json';</code> <br />
            <code>[your-query-here]</code> <br />
            <br />
            Alternatively use:<br />
            <code>EXPLAIN (ANALYZE, FORMAT JSON)</code> <br />
            <code>[your-query-here]</code> <br />
          </div>
          <div class="dropdown ms-auto">
            <button
              class="btn btn-secondary dropdown-toggle"
              type="button"
              id="dropdownMenuButton"
              data-bs-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
            >
              Sample Plans
            </button>
            <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
              <a
                v-for="(sample, index) in samples"
                :key="index"
                class="dropdown-item"
                v-on:click.prevent="loadPlan(sample)"
                href=""
              >
                {{ sample[0] }}
              </a>
            </div>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-sm-7">
          <form v-on:submit.prevent="submitPlan">
            <div class="mb-3">
              <label for="planInput" class="form-label">
                Plan
                <span class="small text-secondary">(<!--text or -->JSON)</span>
              </label>
              <textarea
                :class="['form-control', draggingPlan ? 'dropzone-over' : '']"
                id="planInput"
                rows="8"
                v-model="planInput"
                @dragenter="draggingPlan = true"
                @dragleave="draggingPlan = false"
                @drop.prevent="handleDrop"
                placeholder="Paste execution plan\nOr drop a file"
              >
              </textarea>
            </div>
            <div class="mb-3">
              <label for="queryInput" class="form-label">
                Query <span class="small text-secondary">(optional)</span>
              </label>
              <textarea
                :class="['form-control', draggingQuery ? 'dropzone-over' : '']"
                id="queryInput"
                rows="8"
                v-model="queryInput"
                @dragenter="draggingQuery = true"
                @dragleave="draggingQuery = false"
                @drop.prevent="handleDrop"
                placeholder="Paste corresponding SQL query\nOr drop a file"
              >
              </textarea>
            </div>
            <div class="mb-3">
              <label for="queryName" class="form-label">
                Plan Name <span class="small text-secondary">(optional)</span>
              </label>
              <input
                type="text"
                class="form-control"
                id="queryName"
                v-model="queryName"
                placeholder="Name for the plan"
              />
            </div>
            <button type="submit" class="btn btn-primary">Submit</button>
          </form>
        </div>
        <div class="col-sm-5 mb-4 mt-4 mt-md-0">
          <div class="mb-2">Saved Plans</div>
          <ul class="list-group" v-cloak>
            <li
              class="list-group-item px-2 py-1"
              v-for="plan in savedPlans"
              :key="plan.id"
            >
              <div class="row">
                <div class="col">
                  <button
                    class="btn btn-sm btn-outline-secondary py-0 ms-1 float-end"
                    title="Remove plan from list"
                    v-on:click.prevent="deletePlan(plan)"
                  >
                    <FontAwesomeIcon :icon="faTrash"></FontAwesomeIcon>
                  </button>
                  <button
                    class="btn btn-sm btn-outline-secondary py-0 float-end"
                    title="Edit plan details"
                    v-on:click.prevent="editPlan(plan)"
                  >
                    <FontAwesomeIcon :icon="faEdit"></FontAwesomeIcon>
                  </button>
                  <a
                    v-on:click.prevent="openPlan(plan)"
                    href=""
                    title="Open the plan details"
                  >
                    {{ plan[0] }}
                  </a>
                </div>
              </div>
              <div class="row">
                <div class="col">
                  <small class="text-secondary">
                    created
                    <span :title="plan[3]?.toString()">
                      {{ time_ago(plan[3]) }}
                    </span>
                  </small>
                </div>
                <div class="col-6 text-end"></div>
              </div>
            </li>
          </ul>
          <p
            class="text-secondary text-center"
            v-if="!savedPlans?.length"
            v-cloak
          >
            <em> You haven't saved any plan yet.</em>
          </p>
        </div>
      </div>
    </div>
  </main-layout>
</template>
