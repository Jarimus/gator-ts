import { error } from "console";
import { CommandsRegistry, handlerLogin, registerCommand, CommandHandler, runCommand } from "./commands";

function main() {
  // Register valid commands
  const cmdRegistry: CommandsRegistry = new Map<string, CommandHandler>;
  registerCommand(cmdRegistry, "login", handlerLogin);

  // Process input
  const argv = process.argv.slice(2);
  if (argv.length < 1) {
    throw error("No arguments provided", 1);
  }

  // Run the command
  const cmdName = argv[0];
  const args = argv.slice(1);
  runCommand(cmdRegistry, cmdName, ...args);
}

main();
