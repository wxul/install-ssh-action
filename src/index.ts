import * as core from "@actions/core";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const BASE_SSH_PATH = resolve(process.env["HOME"], ".ssh");

async function run() {
  const name = core.getInput("name", { required: true });
  const ssh_key = core.getInput("ssh_key", { required: true });
  const known_hosts = core.getInput("known_hosts");
  const if_exist = core.getInput("if_exist") || "ignore";
  const clean = !!core.getInput("clean");
  const config = core.getInput("config", { required: true });

  if (!existsSync(BASE_SSH_PATH)) {
    mkdirSync(BASE_SSH_PATH, {
      mode: 0o700,
      recursive: true,
    });
  }

  const sshKeyFilePath = resolve(BASE_SSH_PATH, name);
  if (existsSync(sshKeyFilePath)) {
    if (if_exist === "ignore") {
      return;
    } else if (if_exist === "override") {
      writeFileSync(sshKeyFilePath, ssh_key + "\n", {
        mode: 0o600,
        flag: "w",
      });
    } else {
      throw new Error("Config file exist!");
    }
  } else {
    writeFileSync(sshKeyFilePath, ssh_key + "\n", {
      mode: 0o600,
      flag: "w",
    });
  }

  const sshConfigFilePath = resolve(BASE_SSH_PATH, "config");
  const sshConfig = existsSync(sshConfigFilePath)
    ? readFileSync(sshConfigFilePath).toString()
    : "";
  if (!sshConfig.includes(config)) {
    writeFileSync(sshConfigFilePath, "\n" + config + "\n", {
      mode: 0o644,
      flag: clean ? "w" : "a",
    });
  }

  if (known_hosts) {
    const knownHostFilePath = resolve(BASE_SSH_PATH, "known_hosts");
    const knownHost = existsSync(knownHostFilePath)
      ? readFileSync(knownHostFilePath).toString()
      : "";
    if (knownHost.includes(known_hosts)) {
      writeFileSync(knownHostFilePath, "\n" + known_hosts + "\n", {
        mode: 0o644,
        flag: "a",
      });
    }
  }

  core.info("SSH key has installed");
}

run().catch((error) => {
  core.setFailed(error.message);
});
