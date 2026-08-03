import { createInitialState } from "./modules/state.js";
import { renderAppStatus } from "./modules/app.js";

const state = createInitialState();
renderAppStatus(state);
