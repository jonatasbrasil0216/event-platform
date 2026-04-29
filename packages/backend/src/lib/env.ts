import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().default("7d"),
  OPENAI_API_KEY: z.string().min(1),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development")
});

export type Env = z.infer<typeof envSchema>;

export const validateEnv = (input: Record<string, string | undefined>): Env => {
  const parsed = envSchema.safeParse(input);
  if (!parsed.success) {
    const reason = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment configuration: ${reason}`);
  }
  return parsed.data;
};

let cachedEnv: Env | null = null;
let envLoaded = false;

const ensureEnvLoaded = () => {
  if (envLoaded) {
    return;
  }

  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env")
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      dotenv.config({ path: candidate });
      envLoaded = true;
      return;
    }
  }

  dotenv.config();
  envLoaded = true;
};

export const getEnv = (): Env => {
  if (cachedEnv) {
    return cachedEnv;
  }
  ensureEnvLoaded();
  cachedEnv = validateEnv(process.env);
  return cachedEnv;
};
