import http from "node:http";
import { Glacier, Request, Response, RequestMethod } from "./types.js";
import { buildRoutingTable, response } from "./lib/index.js";

const Glacier: Glacier = async options => {
	console.log("❄️	Glacier.js is starting...");

	const { port, routesDir } = options;

	console.log("❄️	Building routes...");
	const routingTable = await buildRoutingTable(routesDir);

	http.createServer(async (httpReq, httpRes) => {
		try {
			const chunks = [];
			for await (const chunk of httpReq) chunks.push(chunk);
			const body = JSON.parse(Buffer.concat(chunks).toString() || "null");

			const url = new URL(httpReq.url || "/", `http://${httpReq.headers.host}`);

			if (url.pathname === "/favicon.ico") {
				httpRes.statusCode = 404;
				httpRes.end(404);

				return;
			}

			const req: Request = {
				stdlib: httpReq,
				method: httpReq.method?.toUpperCase() as RequestMethod,
				body,
				url,
				params: {},
				query: {},
				booleans: {},
			};
			const res = response(httpRes, body);

			const { before, main, after } = routingTable[url.pathname];

			if (before) await before(req, res);
			await main(req, res);
			if (after) await after(req, res);
		} catch (err: unknown) {
			httpRes.setHeader("Content-Type", "text/html");

			if (err instanceof Error) {
				if ("code" in err && err.code === "ERR_MODULE_NOT_FOUND") {
					httpRes.statusCode = 404;
					httpRes.end("<p>Not found.</p>");
				} else {
					httpRes.statusCode = 500;
					httpRes.end("<p>Internal server error.</p>");
				}
			}

			return;
		}
	}).listen(port, () => {
		console.log(`❄️	Glacier.js live on port ${port}.`);
	});
};

export default Glacier;
export type { Request, Response };
