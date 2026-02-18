import { loadEnv } from 'dotenv-local';
import express from 'express';
import { s as serverBefore, h as handler, a as serverAfter, b as serverListening, c as serverError } from './bin/index-CeHQv04-.js';
import './bin/api/something-zl0Qfvqg.js';

var server = express();
serverBefore?.(server);
var { HOST, PORT } = loadEnv({
  envPrefix: "SERVER_",
  removeEnvPrefix: true,
  envInitial: {
    SERVER_HOST: "127.0.0.1",
    SERVER_PORT: "3000"
  }
});
var SERVER_URL = `http://${HOST}:${PORT}${"/"}`;
server.use("/api", handler);
server.use("/", express.static("client"));
serverAfter?.(server);
var PORT_NRO = parseInt(PORT);
server.listen(PORT_NRO, HOST, () => {
  console.log(`Ready at ${SERVER_URL}`);
  serverListening?.();
}).on("error", (error) => {
  console.error(`Error at ${SERVER_URL}`, error);
  serverError?.(server, error);
});
