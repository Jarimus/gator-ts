import { error } from "console";
import { CommandsRegistry, handlerLogin, registerCommand, CommandHandler, runCommand, handlerRegister, handlerReset, handlerListUsers, handlerGetFeeds, handlerAddFeed, handlerFollow, handlerFollowing, handlerFeeds, middlewareLoggedIn } from "./commands";

async function main() {
  // Register valid commands
  const cmdRegistry: CommandsRegistry = new Map<string, CommandHandler>;
  registerCommand(cmdRegistry, "login", handlerLogin);
  registerCommand(cmdRegistry, "register", handlerRegister);
  registerCommand(cmdRegistry, "reset", handlerReset);
  registerCommand(cmdRegistry, "users", handlerListUsers);
  registerCommand(cmdRegistry, "agg", handlerGetFeeds);
  registerCommand(cmdRegistry, "addfeed", middlewareLoggedIn(handlerAddFeed));
  registerCommand(cmdRegistry, "follow", middlewareLoggedIn(handlerFollow));
  registerCommand(cmdRegistry, "following", middlewareLoggedIn(handlerFollowing));
  registerCommand(cmdRegistry, "feeds", handlerFeeds);

  // Process input
  const argv = process.argv.slice(2);
  if (argv.length < 1) {
    throw error("No arguments provided", 1);
  }

  // Run the command
  const cmdName = argv[0];
  const args = argv.slice(1);
  try {
    await runCommand(cmdRegistry, cmdName, ...args);
  } catch(err) {
    process.exit(1);
  }
  
  // Exit
  process.exit(0);
}

main();
