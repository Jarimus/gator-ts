import { eq } from "drizzle-orm";
import { db } from "..";
import { users } from "../schema";  

export async function createUser(name: string) {
    const [result] = await db.insert(users).values({ name: name }).returning();
    return result;
}

export async function getUserByName(name: string) {
    try {
        const [result] = await db.select().from(users).where(eq(users.name, name));
        return result;
    } catch (err) {
        console.log(err);
    }
}

export async function getUserById(id: string) {
    try {
        const [result] = await db.select().from(users).where(eq(users.id, id));
        return result;
    } catch (err) {
        console.error(err);
    }
}

export async function deleteAllUsers() {
    try {
        const [result] = await db.delete(users);
    } catch (err) {
        console.log(`Error deleting users: ${err}`);
        process.exit(1);
    }
}

export async function getAllUsers() {
    try {
        const result = await db.select().from(users);
        return result;
    } catch(err) {
        console.log(`Error getting all users: ${err}`);
        process.exit(1);
    }
}