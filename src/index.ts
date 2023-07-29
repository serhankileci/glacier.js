import http from "node:http";
import { Glacier, Request, Response, RequestMethod } from "./types.js";
import {
	buildRoutingTable,
	parseRequestBody,
	response,
	routeAndMiddlewareStack,
} from "./lib/index.js";

const Glacier: Glacier = async options => {
	console.log("❄️	Glacier.js is starting...");

	const { port, routesDir } = options;

	console.log("❄️	Building routes...");
	const routingTable = await buildRoutingTable(routesDir);

	http.createServer(async (httpReq, httpRes) => {
		try {
			const method = httpReq.method?.toUpperCase() as RequestMethod;
			const methodsWithRequestBody = ["POST", "PUT", "PATCH", "DELETE"];
			const url = new URL(httpReq.url || "/", `http://${httpReq.headers.host}`);
			const { pathname } = url;

			if (pathname === "/favicon.ico") {
				httpRes.statusCode = 404;
				httpRes.end(404);
				return;
			}

			const req: Request = {
				stdlib: httpReq,
				method,
				body: methodsWithRequestBody.includes(method)
					? await parseRequestBody(httpReq)
					: {},
				url,
				query: Object.fromEntries(url.searchParams.entries()),
				params: {},
			};
			const res = response(httpRes);

			await routeAndMiddlewareStack(pathname, routingTable, [req, res]);
		} catch (err: unknown) {
			httpReq.statusCode = 500;
			httpRes.end(JSON.stringify(err?.toString()));
		}
	}).listen(port, () => {
		console.log(`❄️	Glacier.js live on port ${port}.`);
	});
};

export default Glacier;
export type { Request, Response };
