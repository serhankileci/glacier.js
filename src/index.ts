import http from "node:http";
import { Glacier, Request, Response, RequestMethod } from "./types.js";
import {
	buildRoutingTable,
	defaultResponses,
	parseParams,
	parseRequestBody,
	response,
	routeAndMiddlewareStack,
} from "./lib/index.js";
import { normalizePathname } from "./lib/util.js";

const Glacier: Glacier = async options => {
	console.log("❄️	Glacier.js is starting...");

	const { port, routesDir } = options;

	console.log("❄️	Building routes...");
	const routingTable = await buildRoutingTable(routesDir);

	http.createServer(async (httpReq, httpRes) => {
		try {
			const normalizedPathname = normalizePathname(httpReq.url);

			if (normalizedPathname !== httpReq.url) {
				httpRes.writeHead(302, {
					Location: normalizedPathname,
				});
				httpRes.end();
				return;
			}

			const method = httpReq.method?.toUpperCase() as RequestMethod;
			const url = new URL(httpReq.url || "/", `http://${httpReq.headers.host}`);
			const { pathname } = url;

			if (pathname === "/favicon.ico") {
				httpRes.statusCode = 404;
				httpRes.end(404);
				return;
			}

			const req: Request = {
				url,
				method,
				stdlib: httpReq,
				query: Object.fromEntries(url.searchParams.entries()),
				params: parseParams(routingTable, pathname),
				body: await parseRequestBody(httpReq),
			};
			const res = response(httpRes);

			await routeAndMiddlewareStack(pathname, routingTable, [req, res]);
		} catch (err: unknown) {
			defaultResponses.internalServerError(JSON.stringify(err), httpReq, httpRes);
		}
	}).listen(port, () => {
		console.log(`❄️	Glacier.js live on port ${port}.`);
	});
};

export default Glacier;
export type { Request, Response };
