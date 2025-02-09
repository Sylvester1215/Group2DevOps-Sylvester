import express from "express";
import bodyParser from "body-parser";
import { MEMBERS_ROUTER } from "./utils/routes/MemberRoutes.mjs";
import { GYM_PROGRAMS_ROUTER } from "./utils/routes/GymProgramRoutes.mjs";
import { KILL_ROUTER } from "./utils/routes/KillRoutes.mjs";
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import cors from "cors";
import statusMonitor from 'express-status-monitor';
import { collectDefaultMetrics, register, Counter, Gauge } from 'prom-client';

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
app.use(statusMonitor());

// Setup Prometheus Metrics
collectDefaultMetrics({ timeout: 5000 });

// Define custom metrics
const httpMetricsLabelNames = ['method', 'path'];
const totalHttpRequestCount = new Counter({
    name: 'nodejs_http_total_count',
    help: 'Total request count',
    labelNames: httpMetricsLabelNames
});
const totalHttpRequestDuration = new Gauge({
    name: 'nodejs_http_total_duration',
    help: 'The last duration or response time of last request',
    labelNames: httpMetricsLabelNames
});

// Middleware to track request metrics
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        totalHttpRequestCount.labels(req.method, req.path).inc();
        totalHttpRequestDuration.labels(req.method, req.path).set(Date.now() - start);
    });
    next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

// https://stackoverflow.com/questions/8817423/why-is-dirname-not-defined-in-node-repl
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(path.join(__dirname, "/dist")));

const ROUTER = express.Router();

ROUTER.use("/members", MEMBERS_ROUTER);
ROUTER.use("/gym-programs", GYM_PROGRAMS_ROUTER);
ROUTER.use("/kill", KILL_ROUTER);

app.get("/", (req, res) => {
    res.sendFile(path.resolve(`${__dirname}/public/${START_PAGE}`));
});

app.use("/api", ROUTER);

export let server = app.listen(PORT, function () {
    const { address, port } = server.address();
    const baseUrl = `http://${address === "::" ? "localhost" : address}:${port}`;
    console.log(`Demo project at: ${baseUrl}`);
});
