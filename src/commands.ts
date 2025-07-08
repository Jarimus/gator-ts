import { error } from "console";
import { setUser } from "./config";

export type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;

export type CommandsRegistry = Map<string, CommandHandler>;

export function registerCommand(registry: CommandsRegistry, cmdName: string, handler: CommandHandler) {
    registry.set(cmdName, handler);
}

export async function runCommand(registry: CommandsRegistry, cmdName: string, ...args: string[]) {
    const handler = registry.get(cmdName);
    if (handler) {
        handler(cmdName, ...args);
    } else {
        throw error("Not enough arguments", 1);
    }
}

export async function handlerLogin(cmdName: string, ...args: string[]) {
    if (args.length < 1) {
        throw error("Login command needs an argument: login <username>", 1)
    }
    setUser(args[0]);
    console.log(`Current user set to ${args[0]}`);
}