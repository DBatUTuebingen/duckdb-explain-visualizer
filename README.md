duckdb-explain-visualizer: A VueJS component to show a graphical vizualization of a DuckDB execution
plan.

![DuckDB Explain Visualizer screenshot](duckdb-explain-visualizer-screenshot.png)

# Usage

To use the explain vizualizer you can choose one of the following options:

## Service (recommended)

[db.cs.uni-tuebingen.de/explain](https://db.cs.uni-tuebingen.de/explain)

This service is provided by the Database Systems Research Group @ University of Tübingen and can help you to share your plans with colleagues or customers.

## All-in-one local (no installation, no network)

The DuckDB Explain Visualizer can be run locally without any external internet resource.

Simply download
[index.html](https://www.github.com/DBatUTuebingen/duckdb-explain-visualizer/releases/latest/download/index.html),
open it in your favorite internet browser.

## Integrated in a web application

### Without building tools

```html
<script src="https://unpkg.com/vue@3.2.45/dist/vue.global.prod.js"></script>
<script src="https://unpkg.com/duckdb-explain-visualizer/dist/duckdb-explain-visualizer.umd.js"></script>
<link
  href="https://unpkg.com/bootstrap@5.3.2/dist/css/bootstrap.min.css"
  rel="stylesheet"
/>
<link
  rel="stylesheet"
  href="https://unpkg.com/duckdb-explain-visualizer/dist/style.css"
/>

<div id="app">
  <duckdb-explain-visualizer :plan-source="plan" plan-query="" />
</div>

<script>
  const { createApp } = Vue

  const plan =
    '{ "name": "GENERATE_SERIES ", "children": [], "extra_info": { "Function": "GENERATE_SERIES", "Estimated Cardinality": "9" } }'

  const app = createApp({
    data() {
      return {
        plan: plan,
      }
    },
  })
  app.component("duckdb-explain-visualizer", duckdb - explain - visualizer.Plan)
  app.mount("#app")
</script>
```

[See it live](https://stackblitz.com/edit/pev2-vanilla).

### With build tools

The DuckDB Explain Visualizer can be integrated as a component in a web application.

Install it:

```
npm install duckdb-explain-visualizer
```

Declare the `duckdb-explain-visualizer` component and use it:

```javascript
import { Plan } from "duckdb-explain-visualizer"
import "duckdb-explain-visualizer/dist/style.css"

export default {
  name: "DuckDB Explain Visualizer example",
  components: {
    "duckdb-explain-visualizer": Plan,
  },
  data() {
    return {
      plan: plan,
      query: query,
    }
  },
}
```

Then add the `duckdb-explain-visualizer` component to your template:

```html
<div id="app">
  <duckdb-explain-visualizer
    :plan-source="plan"
    :plan-query="query"
  ></duckdb-explain-visualizer>
</div>
```

The DuckDB Explain Visualizer requires `Bootstrap (CSS)` to work so don't forget to
add the following in you header (or load them with your favorite bundler).

```html
<link
  href="https://unpkg.com/bootstrap@5.3.2/dist/css/bootstrap.min.css"
  rel="stylesheet"
/>
```

[See it live](https://stackblitz.com/edit/pev2-vite).

# Disclaimer

This project is a hard fork of the excellent [Postgres Explain Visualizer 2 (PEV2)][pev2]. Kudos go to [Dalibo][dalibo]. We have adapted the project to work with DuckDB. The initial heavy lifting was done by Matthis Noël (https://github.com/Matthis02).

[pev2]: https://github.com/dalibo/pev2/
[dalibo]: https://www.dalibo.com/
