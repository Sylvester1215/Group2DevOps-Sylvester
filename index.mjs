// import express from "express";
// import bodyParser from "body-parser";
// import { MEMBERS_ROUTER } from "./utils/routes/MemberRoutes.mjs";
// import { GYM_PROGRAMS_ROUTER } from "./utils/routes/GymProgramRoutes.mjs";
// import { KILL_ROUTER } from "./utils/routes/KillRoutes.mjs";
// import { fileURLToPath } from 'url';
// import path, { dirname } from 'path';
// import cors from "cors";
// import promClient from 'prom-client';

// export let app = express();

// const PORT = process.env.PORT || 5050;
// const START_PAGE = "index.html";
// // Set up Prometheus metrics
// const register = new promClient.Registry();
// const httpRequestDurationMicroseconds = new promClient.Histogram({
//     name: 'http_request_duration_seconds',
//     help: 'Duration of HTTP requests in seconds',
//     labelNames: ['method', 'route', 'status_code'],
//     buckets: [0.1, 0.5, 1, 2, 5, 10]  // Define buckets for histogram
// });

// register.registerMetric(httpRequestDurationMicroseconds);

// // Default metrics
// promClient.collectDefaultMetrics({ register });

// // Create a /metrics endpoint for Prometheus to scrape
// app.get('/metrics', async (req, res) => {
//     res.set('Content-Type', register.contentType);
//     res.end(await register.metrics());
// });



// const CORS_OPTIONS =
// {
//     origin: true,
//     optionsSuccessStatus: 200
// };

// app.use(cors(CORS_OPTIONS));

// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());

// import statusMonitor from 'express-status-monitor';
// app.use(statusMonitor());

// // https://stackoverflow.com/questions/8817423/why-is-dirname-not-defined-in-node-repl
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// app.use(express.static(path.join(__dirname, "/dist")));

// const ROUTER = express.Router();

// ROUTER.use("/members", MEMBERS_ROUTER);
// ROUTER.use("/gym-programs", GYM_PROGRAMS_ROUTER);
// // Used for killing the server
// ROUTER.use("/kill", KILL_ROUTER);


// app.get("/", (req, res) =>
// {
//     // https://stackoverflow.com/questions/14594121/express-res-sendfile-throwing-forbidden-error
//     res.sendFile(path.resolve(`${__dirname}/public/${START_PAGE}`));
// });

// app.use("/api", ROUTER);

// // Monitor HTTP requests and record metrics
// app.use((req, res, next) => {
//     const start = Date.now();
//     res.on('finish', () => {
//         const duration = (Date.now() - start) / 1000; // Convert to seconds
//         httpRequestDurationMicroseconds
//             .labels(req.method, req.originalUrl, res.statusCode)
//             .observe(duration);
//     });
//     next();
// });

// export let server = app.listen(PORT, function () {
//     const { address, port } = server.address();
//     const baseUrl = `http://${address === "::" ? "localhost" : address}:${port}`;
//     console.log(`Demo project at: ${baseUrl}`);
// });
// ----------------------------------------------------------
import express from "express";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import cors from "cors";
import promClient from "prom-client";
import pidusage from "pidusage";
import os from "os";
import { exec } from "child_process";

export let app = express();

const PORT = process.env.PORT || 5050;
const START_PAGE = "index.html";

const CORS_OPTIONS = {
    origin: true,
    optionsSuccessStatus: 200
};

app.use(cors(CORS_OPTIONS));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

import statusMonitor from 'express-status-monitor';
app.use(statusMonitor());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(path.join(__dirname, "/dist")));

// ---- Prometheus Metrics Setup ----
const register = promClient.register;
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ register });

// ---- ✅ HTTP Request Counter ----
const httpRequestsTotal = new promClient.Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests received",
    labelNames: ["method", "route", "status"]
});

app.use((req, res, next) => {
    res.on("finish", () => {
        httpRequestsTotal.labels(req.method, req.path, res.statusCode).inc();
    });
    next();
});

// ---- ✅ CPU Usage (Fixed for Multi-Core Processors) ----
const cpuUsageGauge = new promClient.Gauge({
    name: "node_cpu_usage",
    help: "Total CPU usage percentage"
});

const systemCpuUsageGauge = new promClient.Gauge({
    name: "system_cpu_usage",
    help: "System-wide CPU usage percentage"
});

// ---- ✅ Memory Metrics ----
const totalMemoryGauge = new promClient.Gauge({
    name: "node_total_memory",
    help: "Total system memory in bytes"
});

const usedMemoryGauge = new promClient.Gauge({
    name: "node_used_memory",
    help: "Used system memory in bytes"
});

const freeMemoryGauge = new promClient.Gauge({
    name: "node_free_memory",
    help: "Free system memory in bytes"
});

// ---- ✅ System Uptime ----
const uptimeGauge = new promClient.Gauge({
    name: "node_system_uptime",
    help: "System uptime in seconds"
});

// ---- ✅ Load Average ----
const loadAverageGauge = new promClient.Gauge({
    name: "node_load_average",
    help: "System load average (1m)"
});

// ---- ✅ Disk Usage ----
const diskUsageGauge = new promClient.Gauge({
    name: "node_disk_usage",
    help: "Used disk space in bytes"
});

const totalDiskGauge = new promClient.Gauge({
    name: "node_total_disk",
    help: "Total disk space in bytes"
});

// ---- ✅ Swap Usage ----
const swapUsageGauge = new promClient.Gauge({
    name: "node_swap_usage",
    help: "Used swap memory in bytes"
});

const totalSwapGauge = new promClient.Gauge({
    name: "node_total_swap",
    help: "Total swap memory in bytes"
});

// ---- ✅ Metric Update Function (Runs Every 5s) ----
setInterval(async () => {
    try {
        const stats = await pidusage(process.pid);

        // Process CPU Usage
        cpuUsageGauge.set(stats.cpu);

        // System-wide CPU Usage
        const systemLoad = os.loadavg()[0]; // 1-minute load avg
        const numCores = os.cpus().length;
        const systemCpuUsage = (systemLoad / numCores) * 100;
        systemCpuUsageGauge.set(systemCpuUsage);

        // Memory Usage
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;

        totalMemoryGauge.set(totalMem);
        usedMemoryGauge.set(usedMem);
        freeMemoryGauge.set(freeMem);

        // System Uptime
        uptimeGauge.set(os.uptime());

        // Load Average
        loadAverageGauge.set(os.loadavg()[0]);

        // Disk Usage
        exec("df -k --output=used,size /", (error, stdout) => {
            if (error) {
                console.error("Error collecting disk metrics:", error);
                return;
            }
            const lines = stdout.trim().split("\n");
            if (lines.length > 1) {
                const [used, total] = lines[1].split(/\s+/).map(Number);
                diskUsageGauge.set(used * 1024); // Convert KB to Bytes
                totalDiskGauge.set(total * 1024); // Convert KB to Bytes
            }
        });

        // Swap Usage (Linux/macOS Only)
        exec("cat /proc/meminfo | grep Swap", (error, stdout) => {
            if (error) {
                console.error("Error collecting swap metrics:", error);
                return;
            }
            const lines = stdout.split("\n");
            let totalSwap = 0, freeSwap = 0;

            lines.forEach(line => {
                if (line.includes("SwapTotal")) totalSwap = parseInt(line.split(/\s+/)[1]) * 1024;
                if (line.includes("SwapFree")) freeSwap = parseInt(line.split(/\s+/)[1]) * 1024;
            });

            swapUsageGauge.set(totalSwap - freeSwap);
            totalSwapGauge.set(totalSwap);
        });

    } catch (err) {
        console.error("Error collecting system metrics:", err);
    }
}, 5000);

// ---- Expose Metrics Endpoint ----
app.get("/metrics", async (req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
});

// ---- Start Server ----
export let server = app.listen(PORT, function () {
    const { address, port } = server.address();
    const baseUrl = `http://${address === "::" ? "localhost" : address}:${port}`;
    console.log(`Demo project at: ${baseUrl}`);
});
