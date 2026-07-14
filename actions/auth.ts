import { ServerMessage } from "@/lib/definitions";
export function login(): ServerMessage {
    return { success: true, message: "Login successful" };
}
export function register(): ServerMessage {
    return { success: true, message: "Register successful" };
}
