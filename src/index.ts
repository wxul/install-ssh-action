import * as core from "@actions/core";
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "fs";
import { resolve } from "path";

const BASE_SSH_PATH = resolve(process.env["HOME"], ".ssh");

function writeSSHKey(name: string, key: string, if_exist: string) {
  const sshKeyFilePath = resolve(BASE_SSH_PATH, name);
  core.saveState("sshKeyFilePath", sshKeyFilePath);
  if (existsSync(sshKeyFilePath) && if_exist !== "override") {
    if (if_exist === "ignore") {
      core.info("SSH exist, ignore");
      return;
    } else if (if_exist === "fail") {
      throw new Error("Config file exist!");
    }
  } else {
    core.info("SSH key not fount or need override");
    writeFileSync(sshKeyFilePath, key + "\n\n", {
      mode: 0o600,
      flag: "w",
    });
  }
}

function writeSSHConfig(name: string, config: string, if_exist: string) {
  const sshConfigFilePath = resolve(BASE_SSH_PATH, "config");
  const tempSSHConfigPath = resolve(BASE_SSH_PATH, `${name}.config`);

  core.info("Add ssh config file");
  writeFileSync(tempSSHConfigPath, config + "\n\n", {
    mode: 0o644,
    flag: "w",
  });

  core.info("Update ssh config");
  const includeConfig = `Include ${name}.config`;
  const configStr = readFileSync(sshConfigFilePath).toString();
  writeFileSync(sshConfigFilePath, includeConfig + "\n\n" + configStr, {
    mode: 0o644,
    flag: "w",
  });
  core.saveState("sshConfigFilePath", sshConfigFilePath);
  core.saveState("tempSSHConfigPath", tempSSHConfigPath);
  core.saveState("includeConfig", includeConfig);
}

async function install() {
  core.info("Begin install");
  const name = core.getInput("name", { required: true });
  const ssh_key = core.getInput("ssh_key", { required: true });
  const known_hosts = core.getInput("known_hosts");
  const if_exist = core.getInput("if_exist") || "ignore";
  const clean = core.getInput("do_not_clean") !== "true";
  const config = core.getInput("config", { required: true });

  core.saveState("cleanup", clean);

  if (!existsSync(BASE_SSH_PATH)) {
    core.info("SSH dir not fount, create");
    mkdirSync(BASE_SSH_PATH, {
      mode: 0o700,
      recursive: true,
    });
  }

  writeSSHKey(name, ssh_key, if_exist);
  writeSSHConfig(name, config, if_exist);

  core.info("Update known_hosts");
  const knownHostFilePath = resolve(BASE_SSH_PATH, "known_hosts");
  const knownHost = existsSync(knownHostFilePath)
    ? readFileSync(knownHostFilePath).toString()
    : "";
  if (known_hosts && !knownHost.includes(known_hosts)) {
    writeFileSync(knownHostFilePath, "\n\n" + known_hosts + "\n\n", {
      mode: 0o644,
      flag: "a",
    });
  }
  core.saveState("knownHostFilePath", knownHostFilePath);
  core.saveState("known_hosts", known_hosts);

  core.info("SSH key has installed");
}

async function cleanup() {
  core.info("Begin clean");
  const cleanup = core.getState("cleanup") === "true";
  if (!cleanup) return;
  const sshKeyFilePath = core.getState("sshKeyFilePath");
  if (existsSync(sshKeyFilePath)) {
    rmSync(sshKeyFilePath);
    core.info(`Remove ssh_key file: ${sshKeyFilePath}`);
  }

  const sshConfigFilePath = core.getState("sshConfigFilePath");
  const tempSSHConfigPath = core.getState("tempSSHConfigPath");
  const includeConfig = core.getState("includeConfig");
  if (existsSync(sshConfigFilePath)) {
    const content = readFileSync(sshConfigFilePath)
      .toString()
      .replaceAll(includeConfig, "")
      .replace(/\n{2,}/g, "\n\n");
    writeFileSync(sshConfigFilePath, content, { mode: 0o644, flag: "w" });
    core.info(`Remove include in config: ${includeConfig}`);
    rmSync(tempSSHConfigPath);
    core.info(`Remove temp config file: ${tempSSHConfigPath}`);
  }

  const known_hosts = core.getState("known_hosts");
  const knownHostFilePath = core.getState("knownHostFilePath");
  if (existsSync(known_hosts) && known_hosts) {
    const content = readFileSync(knownHostFilePath)
      .toString()
      .replaceAll(known_hosts, "")
      .replace(/\n{2,}/g, "\n\n");
    writeFileSync(knownHostFilePath, content, { mode: 0o644, flag: "w" });
    core.info(`Remove known_hosts`);
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
