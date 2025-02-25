<script lang="ts" setup>
import MainLayout from "../layouts/MainLayout.vue"
</script>

<template>
  <main-layout>
    <div class="container">
      <h2>Acknowledgements</h2>
      <p>
        This project is based on
        <a href="https://github.com/dalibo/pev2"
          >Postgres Explain Visualizer 2 (pev2)</a
        >. Kudos go to <a href="https://github.com/pgiraud">Pierre Giraud</a>.
      </p>

      <p>
        Matthis Noel has modified pev2 to work with DuckDB for his bachelor's
        thesis at the Database Systems Research Group @ University of Tübingen.
      </p>

      <h2>How To Use</h2>
      <p>
        Generate a json query plan using the following lines in any terminal
        running the DuckDB CLI: <br />
        <code>PRAGMA enable_profiling = 'json';</code> <br />
        <code>PRAGMA profiling_output = '/path/to/file.json';</code> <br />
        <code>[your-query-here]</code> <br />
        <br />
        Alternatively use:<br />
        <code>EXPLAIN (ANALYZE, FORMAT JSON)</code> <br />
        <code>[your-query-here]</code> <br />
        Then just drag & drop your <code>JSON</code> file or copy its content
        into the <b>PLAN</b> section. <br />
        You can add a name for the plan (you don't have to). <br />
        Click <b>Submit</b>.
      </p>

      <h2>Help us to improve this service</h2>
      <p>
        This application uses the
        <a href="https://github.com/DBatUTuebingen/duckdb-explain-visualizer"
          >duckdb-explain-visualizer</a
        >
        JS library to display DuckDB plans.
      </p>

      <p>
        Report issues or contribute to the code on
        <a href="https://github.com/DBatUTuebingen/duckdb-explain-visualizer"
          >Github</a
        >.
      </p>

      <hr />
      <div class="text-center text-secondary">
        The <b>duckdb-explain-visualizer</b> is brought to you by
        <a href="https://github.com/DBatUTuebingen"
          >Database Systems Research Group @ University of Tübingen</a
        >
      </div>
    </div>
  </main-layout>
</template>
