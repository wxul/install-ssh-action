import * as core from "@actions/core";
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "fs";
import { resolve } from "path";

const BASE_SSH_PATH = resolve(process.env["HOME"], ".ssh");

function writeSSHKey(name: string, key: string, if_exist: string) {
  const sshKeyFilePath = resolve(BASE_SSH_PATH, name);
  if (existsSync(sshKeyFilePath) && if_exist !== "override") {
    if (if_exist === "ignore") {
      return;
    } else if (if_exist === "fail") {
      throw new Error("Config file exist!");
    }
  } else {
    writeFileSync(sshKeyFilePath, key + "\n", {
      mode: 0o600,
      flag: "w",
    });
  }
  core.saveState("sshKeyFilePath", sshKeyFilePath);
}

function writeSSHConfig(name: string, config: string, if_exist: string) {
  const sshConfigFilePath = resolve(BASE_SSH_PATH, "config");
  const tempSSHConfigPath = resolve(BASE_SSH_PATH, `${name}.config`);

  writeFileSync(tempSSHConfigPath, config + "\n", {
    mode: 0o644,
    flag: "w",
  });

  const includeConfig = `Include ${name}.config`;
  writeFileSync(sshConfigFilePath, "\n" + includeConfig + "\n", {
    mode: 0o644,
    flag: "a",
  });
  core.saveState("sshConfigFilePath", sshConfigFilePath);
  core.saveState("tempSSHConfigPath", tempSSHConfigPath);
  core.saveState("includeConfig", includeConfig);
}

async function install() {
  const name = core.getInput("name", { required: true });
  const ssh_key = core.getInput("ssh_key", { required: true });
  const known_hosts = core.getInput("known_hosts");
  const if_exist = core.getInput("if_exist") || "ignore";
  const clean = core.getInput("do_not_clean") !== "true";
  const config = core.getInput("config", { required: true });
  core.info(`name: ${name}`);
  core.info(`clean: ${clean}, ${typeof clean}, ${core.getInput("do_not_clean")}`);

  core.saveState("cleanup", clean);

  if (!existsSync(BASE_SSH_PATH)) {
    mkdirSync(BASE_SSH_PATH, {
      mode: 0o700,
      recursive: true,
    });
  }

  writeSSHKey(name, ssh_key, if_exist);
  writeSSHConfig(name, config, if_exist);

  const knownHostFilePath = resolve(BASE_SSH_PATH, "known_hosts");
  const knownHost = existsSync(knownHostFilePath)
    ? readFileSync(knownHostFilePath).toString()
    : "";
  if (known_hosts && !knownHost.includes(known_hosts)) {
    writeFileSync(knownHostFilePath, "\n" + known_hosts + "\n", {
      mode: 0o644,
      flag: "a",
    });
  }
  core.saveState("knownHostFilePath", knownHostFilePath);
  core.saveState("known_hosts", known_hosts);

  core.info("SSH key has installed");
}

async function cleanup() {
  const cleanup = core.getState("cleanup") === "true";
  if (!cleanup) return;
  const sshKeyFilePath = core.getState("sshKeyFilePath");
  if (existsSync(sshKeyFilePath)) {
    rmSync(sshKeyFilePath);
  }

  const sshConfigFilePath = core.getState("sshConfigFilePath");
  const tempSSHConfigPath = core.getState("tempSSHConfigPath");
  const includeConfig = core.getState("includeConfig");
  if (existsSync(sshConfigFilePath)) {
    const content = readFileSync(sshConfigFilePath)
      .toString()
      .replace(includeConfig, "");
    writeFileSync(sshConfigFilePath, content, { mode: 0o644, flag: "w" });
    rmSync(tempSSHConfigPath);
  }

  const known_hosts = core.getState("known_hosts");
  const knownHostFilePath = core.getState("knownHostFilePath");
  if (existsSync(known_hosts) && known_hosts) {
    const content = readFileSync(knownHostFilePath)
      .toString()
      .replace(known_hosts, "");
    writeFileSync(knownHostFilePath, content, { mode: 0o644, flag: "w" });
  }
}

async function run() {
  const isCleanup = !!core.getState("isCleanup");
  if (isCleanup) {
    await cleanup();
  } else {
    await install();
    core.saveState("isCleanup", "true");
  }
}

// entry
run().catch((error) => {
  core.setFailed(error.message);
});
