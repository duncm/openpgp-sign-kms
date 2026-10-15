import * as core from "@actions/core";
import { executable } from "../src/download.js";
core.setOutput("cli", await executable());
