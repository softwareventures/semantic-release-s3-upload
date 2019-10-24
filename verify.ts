import {Context} from "semantic-release";
import {Config} from "./config";

export let verified = false;

export default async function verify(config: Config, context: Context): Promise<void> {
    const accessKeyId = context.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = context.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
        throw new Error("Environment variables AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set");
    }

    verified = true;
}