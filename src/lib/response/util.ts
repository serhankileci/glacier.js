import { ServerResponse } from "http";
import { RequestHeaders, DefaultResponses } from "../../types.js";

const defaultResponses: DefaultResponses = {
	notFound: (_, res) => {
		return res.html("Not found.", { status: 404 });
	},
	internalServerError: (err, _, httpRes) => {
		httpRes.writeHead(500, { "content-type": "text/html" });
		httpRes.end(
			`<h1>500 - Internal Server Error</h1><p>${
				err instanceof Error ? err.message : JSON.stringify(err)
			}</p>`
		);
	},
};

function setHeaders(httpRes: ServerResponse, headers?: RequestHeaders) {
	for (const [key, value] of Object.entries(headers || {})) {
		httpRes.setHeader(key, value);
	}
}

export { defaultResponses, setHeaders };
