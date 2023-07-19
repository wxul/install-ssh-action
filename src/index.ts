import * as core from "@actions/core";
import { existsSync, mkdirSync } from "fs";
import { resolve } from "path";

const BASE_SSH_PATH = resolve(process.env["HOME"], ".ssh");

async function run() {
  const name = core.getInput("name", { required: true });
  const ssh_key = core.getInput("ssh_key", { required: true });
  const known_hosts = core.getInput("known_hosts");
  const if_exist = core.getInput("if_exist") || "ignore";
  const config = core.getInput("config", { required: true });

  if (!existsSync(BASE_SSH_PATH)) {
    mkdirSync(BASE_SSH_PATH);
  }

  const configPath = resolve(BASE_SSH_PATH, name);
  if (existsSync(configPath)) {
    if (if_exist === "ignore") {
      return;
    } else {
      throw new Error("Config file exist!");
    }
  }

  // todo
}

run().catch((error) => {
  core.setFailed(error.message);
});
