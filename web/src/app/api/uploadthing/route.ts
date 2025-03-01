import { createRouteHandler } from "uploadthing/next";

import { mainFileRouter } from "./core";

export const { GET, POST } = createRouteHandler({
  router: mainFileRouter
});
