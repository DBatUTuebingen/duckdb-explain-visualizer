/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // Use 'object' instead of '{}' for better type safety
  const component: DefineComponent<object, object, unknown>
  export default component
}
