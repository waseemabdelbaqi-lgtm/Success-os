/** Compatibility shim — prefer `aios.js`. */
export {
  runAIOS as runMasterOrchestrator,
  runAIOS,
  formatAiosDisplay as formatOrchestratorDisplay,
  formatAiosDisplay,
  buildExecutiveReport,
} from "./aios.js";
