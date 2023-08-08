import http from "node:http";
import { Glacier, GlacierRequest, GlacierResponse } from "./types.js";
import {
	buildRoutingTable,
	request,
	response,
	handleResponseAndMiddlewares,
	defaultResponses,
	normalizePathname,
} from "./lib/index.js";

const Glacier: Glacier = async options => {
	console.log("❄️	Glacier.js is starting...");
	const { port, routesDir } = options;
	console.log("❄️	Building routes...");
	const routingTable = await buildRoutingTable(routesDir);

	http.createServer(async (httpReq, httpRes) => {
		try {
			const normalizedPathname = normalizePathname(httpReq.url || "/");

			if (normalizedPathname !== httpReq.url) {
				httpRes.writeHead(302, { Location: normalizedPathname }).end();
				return;
			}

			const url = new URL(normalizedPathname, `http://${httpReq.headers.host}`);

			const req = await request(httpReq, url, routingTable);
			const res = await response(httpRes);

			await handleResponseAndMiddlewares(url.pathname, routingTable, [req, res]);
		} catch (err: unknown) {
			defaultResponses.internalServerError(err, httpReq, httpRes);
		}
	}).listen(port, () => {
		console.log(`❄️	Glacier.js live on port ${port}.`);
	});
};

export default Glacier;
export type { GlacierRequest, GlacierResponse };
