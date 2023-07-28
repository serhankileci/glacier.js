import http from "node:http";
import { Glacier, Request, Response, RequestMethod } from "./types.js";
import { buildRoutingTable, response } from "./lib/index.js";

const Glacier: Glacier = async options => {
	console.log("❄️	Glacier.js is starting...");

	const { port, routesDir } = options;

	console.log("❄️	Building static routes...");
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

			const separatedPaths = ["/"].concat(
				url.pathname
					.split("/")
					.filter(Boolean)
					.map(path => "/" + path)
			);

			const { before, main, after } = routingTable[url.pathname] || {};

			for (const path of separatedPaths) {
				const prev = routingTable[path];

				if (prev?.before) {
					await prev?.before(req, res);
				}
			}

			if (before) await before(req, res);
			await main(req, res);
			if (after) await after(req, res);

			for (const path of separatedPaths) {
				const prev = routingTable[path];

				if (prev?.after) {
					await prev?.after(req, res);
				}
			}

		} catch (err: unknown) {
			httpRes.end(err?.toString());
		}
	}).listen(port, () => {
		console.log(`❄️	Glacier.js live on port ${port}.`);
	});
};

export default Glacier;
export type { Request, Response };
