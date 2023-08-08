import { IncomingMessage, ServerResponse } from "http";
import { GlacierRequest, GlacierResponse, RequestHeaders, RouteHandler } from "../../types.js";

const notFound: RouteHandler = (req: GlacierRequest, res: GlacierResponse) => {
	return res.html("Not found.", { status: 404 });
};

const internalServerError = (err: unknown, _: IncomingMessage, res: ServerResponse) => {
	res.writeHead(500, { "content-type": "text/html" });
	res.end(
		`<h1>500 - Internal Server Error</h1><p>${
			err instanceof Error ? err.message : JSON.stringify(err)
		}</p>`
	);
};

const defaultResponses = {
	notFound,
	internalServerError,
};

function setHeaders(httpRes: ServerResponse, headers?: RequestHeaders) {
	for (const [key, value] of Object.entries(headers || {})) {
		httpRes.setHeader(key, value);
	}
}

export { defaultResponses, setHeaders };
