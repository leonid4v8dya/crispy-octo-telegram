const http = require("http");
const https = require("https");

const TARGET = process.env.TARGET_DOMAIN;
const PORT = process.env.PORT || 3000;

if (!TARGET) {
  throw new Error("TARGET_DOMAIN required");
}

const targetUrl = new URL(TARGET);

const server = http.createServer((req, res) => {
  const path = req.url || "/";

  const options = {
    protocol: targetUrl.protocol,
    hostname: targetUrl.hostname,
    port: targetUrl.port || (targetUrl.protocol === "https:" ? 443 : 80),
    path: path,
    method: req.method,
    headers: {
      ...req.headers,
      host: targetUrl.host, 
    },
  };

  const proxy = (targetUrl.protocol === "https:" ? https : http).request(
    options,
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    }
  );

  req.pipe(proxy, { end: true });

  proxy.on("error", (err) => {
    console.error("Proxy error:", err);
    res.writeHead(502);
    res.end("Bad gateway");
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("Proxy running on", PORT);
});
