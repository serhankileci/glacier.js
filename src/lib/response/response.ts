import { ServerResponse } from "node:http";
import { ContentType, GlacierResponse, ResponseMethodOptions } from "../../types.js";
import { setHeaders } from "./util.js";

function setStatusAndHeaders(
	httpRes: ServerResponse,
	options: ResponseMethodOptions = {},
	contentType: ContentType
) {
	const { status = 200, headers, customHeaders } = options;
	httpRes.statusCode = status;

	// override custom headers in case they overlap with standard headers
	setHeaders(httpRes, Object.assign({}, customHeaders, headers));

	// response method specific content type
	httpRes.setHeader("content-type", contentType);
}

async function response(httpRes: ServerResponse): Promise<GlacierResponse> {
	return {
		custom: {},
		stdlib: httpRes,
		util: {
			setCookie: (key, value) => {
				httpRes.setHeader(key, value);
			},
		},
		redirect: url => {
			httpRes.writeHead(302, { Location: url });
			httpRes.end();
		},
		json: (data, options) => {
			setStatusAndHeaders(httpRes, options, "application/json");

			// stringify if not json
			try {
				if (data?.constructor === String) JSON.parse(data);
			} catch (err: unknown) {
				data = JSON.stringify(data);
			}

			httpRes.end(data);
		},
		html: (data, options) => {
			setStatusAndHeaders(httpRes, options, "text/html");
			httpRes.end(data);
		},
		text: (data, options) => {
			setStatusAndHeaders(httpRes, options, "text/plain");
			httpRes.end(data?.toString());
		},
		xml: (data, options) => {
			setStatusAndHeaders(httpRes, options, "application/xml");
			httpRes.end(data);
		},
	};
}

export { response };
