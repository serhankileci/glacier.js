import { ServerResponse } from "http";
import { Response } from "../../types.js";
import { render } from "./render.js";

function response(httpResponse: ServerResponse, body: Record<string, unknown>): Response {
	return {
		stdlib: httpResponse,
		redirect: url => {
			httpResponse.writeHead(302, { Location: url });
			httpResponse.end();
		},
		custom: {},
		download: () => {
			// ...
		},
		render,
		send: (data, options) => {
			const { headers, status } = options || {};
			// const mimetype = mime.lookup(filename);

			if (status) httpResponse.statusCode = status;

			for (const [key, value] of Object.entries(headers || {}))
				httpResponse.setHeader(key, value);

			if (typeof data === "string" || typeof data === "number") {
				if (headers && !headers["Content-Type"])
					httpResponse.setHeader("Content-Type", "text/html");

				data = String(data);
			} else if (data instanceof Array || data instanceof Object) {
				if (headers && !headers["Content-Type"])
					httpResponse.setHeader("Content-Type", "application/json");

				data = JSON.stringify(data);
			}

			httpResponse.end(data);
		},
	};
}

export { response };
