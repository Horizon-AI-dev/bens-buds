import { createServer, type Server } from "node:http";

type HealthServer = {
  server: Server;
  close: () => Promise<void>;
};

export function startHealthServer(port: number): HealthServer {
  const server = createServer((req, res) => {
    if (req.url === "/healthz") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not Found");
  });

  server.listen(port, () => {
    console.log(`[info] Health server listening on :${port}`);
  });

  return {
    server,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      })
  };
}
