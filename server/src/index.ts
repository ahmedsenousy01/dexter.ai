import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({ message: "Hello Hono!" });
});

const port = 5000;

serve({
  fetch: app.fetch,
  port,
});
