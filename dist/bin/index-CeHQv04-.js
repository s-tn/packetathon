import express from 'express';
import { G as GET } from './api/something-zl0Qfvqg.js';

// src/api-server/configure.ts
var serverBefore = (server) => {
  server.use(express.json());
  server.use(express.urlencoded({ extended: true }));
};
var serverAfter = (server) => {
  const errorHandler = (error, _, res, next) => {
    if (error instanceof Error) {
      res.status(403).json({ error: error.message });
    } else {
      next(error);
    }
  };
  server.use(errorHandler);
};
var callbackBefore = (callback) => {
  return callback;
};
var serverListening = () => {
  console.log(`Server Running`);
};
var serverError = (_, error) => {
  console.log(`Server Error: `, error);
};

// Public RESTful API Methods and Paths
// This section describes the available HTTP methods and their corresponding endpoints (paths).
// USE    /api/something    src/api/something.js?fn=default
// USE    /api/something    src/api/something.js?fn=USE
// GET    /api/something    src/api/something.js?fn=GET
// POST   /api/something    src/api/something.js?fn=POST
// PATCH  /api/something    src/api/something.js?fn=PATCH
// PUT    /api/something    src/api/something.js?fn=PUT
// DELETE /api/something    src/api/something.js?fn=DELETE

const internal  = [
  undefined,
  undefined,
  GET      && { cb: GET     , method: "get"    , route: "/something" , url: "/api/something" , source: "src/api/something.js?fn=GET"     },
  undefined,
  undefined,
  undefined,
  undefined
].filter(it => it);

internal.map((it) => {
  const { method, route, url, source } = it;
  return { method, url, route, source };
});

internal.map(
  (it) => it.method?.toUpperCase() + "\t" + it.url
);

const applyRouters = (applyRouter) => {
  internal.forEach((it) => {
    it.cb = callbackBefore?.(it.cb) || it.cb;
    applyRouter(it);
  });
};

// src/api-server/handler.ts
var handler = express();
applyRouters((props) => {
  const { method, route, path, cb } = props;
  if (handler[method]) {
    if (Array.isArray(cb)) {
      handler[method](route, ...cb);
    } else {
      handler[method](route, cb);
    }
  } else {
    console.log("Not Support", method, "for", route, "in", handler);
  }
});

export { serverAfter as a, serverListening as b, serverError as c, handler as h, serverBefore as s };
