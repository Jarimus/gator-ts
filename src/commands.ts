import { error } from "console";
import { readConfig, setUser } from "./config";
import { createUser, deleteAllUsers, getAllUsers, getUserByName } from "./lib/db/queries/users";
import { db } from "./lib/db";

export type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;

export type CommandsRegistry = Map<string, CommandHandler>;

export function registerCommand(registry: CommandsRegistry, cmdName: string, handler: CommandHandler) {
    registry.set(cmdName, handler);
}

export async function runCommand(registry: CommandsRegistry, cmdName: string, ...args: string[]) {
    const handler = registry.get(cmdName);
    if (handler) {
        try {
            await handler(cmdName, ...args);
        } catch(err) {
            process.exit(1);
        }
    } else {
        throw error("Not enough arguments or command not found", 1);
    }
}

export async function handlerLogin(cmdName: string, ...args: string[]) {
    if (args.length < 1) {
        throw error("Login command needs an argument: login <username>", 1)
    }
    const userName = args[0];
    const dbUser = await getUserByName(userName);
    if (dbUser === undefined) {
        throw error(`User "${userName}" is not in the database.`, 1);
    }
    setUser(userName);
    console.log(`Current user set to ${userName}`);
}

export async function handlerRegister(cmdName:string, ...args: string[]) {
    if (args.length < 1) {
        throw error("Register command needs an argument: register <username>", 1);
    }
    const userName = args[0];
    const dbUser = await getUserByName(userName);
    if (dbUser && dbUser.name === userName) {
        throw error(`User ${userName} already exists`, 1);
    }
    const registeredUser = await createUser(userName);
    console.log("New user created:", registeredUser);
    setUser(userName);
}

export async function handlerReset(cmdName: string, ...args: string[]) {
    // Call the database to clear the users
    await deleteAllUsers();
    console.log("All users deleted successfully");
}

export async function handlerListUsers() {
    // Call the database for all users
    const users = await getAllUsers();
    // If there are no users in the database, display a special message
    if (users.length === 0) {
        console.log("No users in the database.");
        process.exit(0);
    }
    // Get current user from config
    const currentUser = readConfig().currentUserName;
    users.forEach((user) => {
        user.name === currentUser? console.log(user.name, "(current)"): console.log(user.name);
    })
}