import http from "node:http";
import { Glacier, Request, Response, RequestMethod } from "./types.js";
import { buildRoutingTable, response, routeAndMiddlewareStack } from "./lib/index.js";

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
			const { pathname } = url;

			if (pathname === "/favicon.ico") {
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
			};
			const res = response(httpRes);

			await routeAndMiddlewareStack(pathname, routingTable, [req, res]);
		} catch (err: unknown) {
			httpRes.end(JSON.stringify(err?.toString()));
		}
	}).listen(port, () => {
		console.log(`❄️	Glacier.js live on port ${port}.`);
	});
};

export default Glacier;
export type { Request, Response };
