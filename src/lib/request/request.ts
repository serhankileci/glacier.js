import { IncomingMessage } from "http";
import { GlacierRequest, RequestMethod, RoutingTable } from "../../types.js";
import { cookieParser, bodyParser, paramsParser } from "../middlewares/index.js";

async function request(
	httpReq: IncomingMessage,
	url: URL,
	routingTable: RoutingTable
): Promise<GlacierRequest> {
	const method = httpReq.method?.toUpperCase() as RequestMethod;
	const { pathname } = url;

	return {
		url,
		method,
		headers: httpReq.headers,
		stdlib: httpReq,
		query: Object.fromEntries(url.searchParams.entries()),
		cookies: cookieParser(httpReq.headers),
		params: paramsParser(routingTable, pathname),
		body: await bodyParser(httpReq),
	};
}

export { request };
