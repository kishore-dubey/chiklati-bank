import pino from "pino";
import { env } from "../config/env.js";

export const loggerOptions: pino.LoggerOptions = {
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      "*.ssn",
      "*.ein",
      "*.password",
      "*.token",
      "*.cardNumber",
      "*.cvv",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    censor: "[REDACTED]",
  },
  ...(env.NODE_ENV === "development"
    ? { transport: { target: "pino-pretty", options: { colorize: true } } }
    : {}),
};

export const logger = pino(loggerOptions);
