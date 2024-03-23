import { randomUUID } from "crypto";

const corsHeaders = {
  "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
};

const allowedOrigins = ["http://127.0.0.1:3000"];

Bun.serve({
  port: 3001,
  async fetch(req) {
    const origin = req.headers.get("Origin");

    const headers = new Headers(corsHeaders);

    if (origin && allowedOrigins.includes(origin)) {
      headers.set("Access-Control-Allow-Origin", origin);
    }

    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers,
      });
    }

    const url = new URL(req.url);
    if (url.pathname === "/upload") {
      if (!req.body) {
        console.log("no body");
        return new Response("No body!", {
          headers,
        });
      }

      const blob = await Bun.readableStreamToArrayBuffer(req.body);

      const name = `./uploads/${randomUUID()}.webm`;

      Bun.write(name, blob);

      await Bun.spawn([
        "ffmpeg",
        "-i",
        name,
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "23",
        "-c:a",
        "aac",
        "-b:a",
        "256k",
        "-vf",
        "scale=trunc(iw/2)*2:trunc(ih/2)*2",
        `${name.replaceAll(".webm", "")}.mp4`,
      ]);

      const res = new Response("Upload!");

      for (const [key, value] of req.headers) {
        res.headers.set(key, value);
      }

      return new Response(res.body, { headers, status: 200 });
    }
    return new Response("404!", {
      status: 404,
      headers,
    });
  },
});
