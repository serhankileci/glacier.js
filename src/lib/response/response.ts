import { ServerResponse } from "http";
import { Response } from "../../types.js";

function response(httpResponse: ServerResponse): Response {
	return {
		stdlib: httpResponse,
		custom: {},
		redirect: url => {
			httpResponse.writeHead(302, { Location: url });
			httpResponse.end();
		},
		send: (data, options) => {
			const { headers, status } = options || {};
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
