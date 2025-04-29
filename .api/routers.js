
// Files Imports
import * as configure from "@api/configure";
import * as API_000 from "@api/root/src/api/something.js";

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
  API_000.default  && { cb: API_000.default , method: "use"    , route: "/something" , url: "/api/something" , source: "src/api/something.js?fn=default" },
  API_000.USE      && { cb: API_000.USE     , method: "use"    , route: "/something" , url: "/api/something" , source: "src/api/something.js?fn=USE"     },
  API_000.GET      && { cb: API_000.GET     , method: "get"    , route: "/something" , url: "/api/something" , source: "src/api/something.js?fn=GET"     },
  API_000.POST     && { cb: API_000.POST    , method: "post"   , route: "/something" , url: "/api/something" , source: "src/api/something.js?fn=POST"    },
  API_000.PATCH    && { cb: API_000.PATCH   , method: "patch"  , route: "/something" , url: "/api/something" , source: "src/api/something.js?fn=PATCH"   },
  API_000.PUT      && { cb: API_000.PUT     , method: "put"    , route: "/something" , url: "/api/something" , source: "src/api/something.js?fn=PUT"     },
  API_000.DELETE   && { cb: API_000.DELETE  , method: "delete" , route: "/something" , url: "/api/something" , source: "src/api/something.js?fn=DELETE"  }
].filter(it => it);

export const routers = internal.map((it) => {
  const { method, route, url, source } = it;
  return { method, url, route, source };
});

export const endpoints = internal.map(
  (it) => it.method?.toUpperCase() + "\t" + it.url
);

export const applyRouters = (applyRouter) => {
  internal.forEach((it) => {
    it.cb = configure.callbackBefore?.(it.cb, it) || it.cb;
    applyRouter(it);
  });
};

