import * as core from "@actions/core";
import { existsSync, mkdirSync, statSync, writeFileSync } from "fs";
import { resolve } from "path";

const BASE_SSH_PATH = resolve(process.env["HOME"], ".ssh");

async function run() {
  const name = core.getInput("name", { required: true });
  const ssh_key = core.getInput("ssh_key", { required: true });
  const known_hosts = core.getInput("known_hosts");
  const if_exist = core.getInput("if_exist") || "ignore";
  const config = core.getInput("config", { required: true });

  if (!existsSync(BASE_SSH_PATH)) {
    mkdirSync(BASE_SSH_PATH, {
      mode: 0o755,
      recursive: true,
    });
  }

  const sshKeyFilePath = resolve(BASE_SSH_PATH, name);
  if (existsSync(sshKeyFilePath)) {
    if (if_exist === "ignore") {
      return;
    } else {
      throw new Error("Config file exist!");
    }
  }

  writeFileSync(sshKeyFilePath, ssh_key, {
    mode: 0o600,
  });

  const sshConfigFilePath = resolve(BASE_SSH_PATH, "config");
  writeFileSync(sshConfigFilePath, "\n" + config + "\n", {
    mode: 0o644,
    flag: "a",
  });

  if (known_hosts) {
    const knownHostFilePath = resolve(BASE_SSH_PATH, "known_hosts");
    writeFileSync(knownHostFilePath, "\n" + known_hosts + "\n", {
      mode: 0o644,
      flag: "a",
    });
  }

  core.info("SSH key has installed");
}

run().catch((error) => {
  core.setFailed(error.message);
});
