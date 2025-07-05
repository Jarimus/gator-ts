import { readFileSync, writeFileSync } from "fs";
import { homedir } from "os";

const cfgPath = homedir + "/.gatorconfig.json"

type Config = {
  dbUrl: string;
  currentUserName: string;
};

export function readConfig(): Config {
    const data = readFileSync(cfgPath, 'utf-8');
    const rawConfig = JSON.parse(data);
    const cfg = validateConfig(rawConfig);
  //   const cfg: Config = {
  //   dbUrl: rawConfig.db_url,
  //   currentUserName: rawConfig.current_user_name,
  // };
    return cfg;
}

function validateConfig(rawConfig: any) {
  if (!rawConfig.db_url || typeof rawConfig.db_url !== "string") {
    throw new Error("db_url is required in config file");
  }
  if (
    !rawConfig.current_user_name ||
    typeof rawConfig.current_user_name !== "string"
  ) {
    throw new Error("current_user_name is required in config file");
  }
    const config: Config = {
    dbUrl: rawConfig.db_url,
    currentUserName: rawConfig.current_user_name,
  };

  return config;
}

export function setUser(user: string) {
    const cfg: Config = readConfig();
    cfg.currentUserName = user;
    writeConfig(cfg);
}

function writeConfig(config: Config) {
  const rawConfig = {
    db_url: config.dbUrl,
    current_user_name: config.currentUserName,
  };
  const data = JSON.stringify(rawConfig, null, 2);
  writeFileSync(cfgPath, data, { encoding: "utf-8" });
}