import { ServerResponse } from "node:http";
import { GlacierResponse } from "../../types.js";
import { setHeaders } from "./util.js";

async function response(httpRes: ServerResponse): Promise<GlacierResponse> {
	return {
		stdlib: httpRes,
		custom: {},
		redirect: url => {
			httpRes.writeHead(302, { Location: url });
			httpRes.end();
		},
		json: (data, options) => {
			const { status = 200, headers, customHeaders } = options || {};
			httpRes.statusCode = status;

			// override customHeaders in case they overlap with headers
			setHeaders(httpRes, Object.assign({}, customHeaders, headers));
			httpRes.setHeader("content-type", "application/json");

			// stringify if not json
			try {
				if (data?.constructor === String) JSON.parse(data);
			} catch (err: unknown) {
				data = JSON.stringify(data);
			}

			httpRes.end(data);
		},
		html: (data, options) => {
			const { status = 200, headers, customHeaders } = options || {};
			httpRes.statusCode = status;

			// override customHeaders in case they overlap with headers
			setHeaders(httpRes, Object.assign({}, customHeaders, headers));
			httpRes.setHeader("content-type", "text/html");

			httpRes.end(data);
		},
		text: (data, options) => {
			const { status = 200, headers, customHeaders } = options || {};
			httpRes.statusCode = status;

			// override customHeaders in case they overlap with headers
			setHeaders(httpRes, Object.assign({}, customHeaders, headers));
			httpRes.setHeader("content-type", "text/plain");

			httpRes.end(data?.toString());
		},
	};
}

export { response };
