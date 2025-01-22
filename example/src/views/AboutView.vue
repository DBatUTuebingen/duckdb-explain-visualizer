<script lang="ts" setup>
import MainLayout from "../layouts/MainLayout.vue"
</script>

<template>
  <main-layout>
    <div class="container">
      <h2>Disclaimer</h2>
      <p>
        This project is based on
        <a href="https://github.com/dalibo/pev2"
          >Postgres Explain Visualizer 2 (pev2)</a
        >. Kudos go to
        <a href="https://github.com/pgiraud"
          >Pierre Giraud</a>.
      </p>

<!--      <p>-->
<!--        The pev project was initialy written in early 2016 but seem to be-->
<!--        abandonned since then. There was no activity at all for more than-->
<!--        <a href="https://github.com/AlexTatiyants/pev/issues/42"-->
<!--          >3 years and counting</a-->
<!--        >-->
<!--        though there are-->
<!--        <a href="https://github.com/AlexTatiyants/pev/issues"-->
<!--          >several issues open</a-->
<!--        >-->
<!--        and relevant pull requests pending.-->
<!--      </p>-->

      <h2>How To Use</h2>
      <p>
        Generate a json query plan using
        the following lines in any terminal running the DuckDB CLI: <br>
        <code>PRAGMA enable_profiling = 'json';</code> <br>
        <code>PRAGMA profiling_output = '/path/to/file.json';</code> <br>
        <code>[your-query-here]</code> <br>
        Then just drag & drop your <code>JSON</code> file or copy its content into the <b>PLAN</b> section. <br>
        You can add a name for the plan (you don't have to). <br>
        Click <b>Submit</b>.
      </p>
<!--      <p>-->
<!--        DEV can also parse text although the JSON format usually has better-->
<!--        support.-->
<!--      </p>-->

<!--      <h2>Help improve DEV</h2>-->
<!--      <p>You can help us.</p>-->

<!--      <p>-->
<!--        Report issues or contribute to the code on-->
<!--        <a href="https://github.com/DBatUTuebingen/pev2">Github</a>.-->
<!--      </p>-->

      <hr />
      <div class="text-center text-secondary">
        <b>DEV</b> is brought to you by
        <a href="https://github.com/DBatUTuebingen">Database Systems Research Group @ University of Tübingen</a>
      </div>
    </div>
  </main-layout>
</template>
