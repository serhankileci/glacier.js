import { IncomingMessage } from "http";
import { XMLParser } from "fast-xml-parser";
const parser = new XMLParser();

function parseRequestBody(httpReq: IncomingMessage): Promise<Record<string, string>> {
	return new Promise((resolve, reject) => {
		let rawData = "";
		let body = {};

		httpReq.on("data", chunk => (rawData += chunk));
		httpReq.on("error", err => reject(err));
		httpReq.on("end", () => {
			const contentType = httpReq.headers["content-type"];
			const isJSON = contentType?.includes("application/json");
			const isFormData = contentType?.includes("application/x-www-form-urlencoded");
			const isXML = contentType?.includes("application/xml");

			if (isJSON) {
				body = JSON.parse(rawData);
			} else if (isFormData) {
				const result: Record<string, string> = {};
				const obj = rawData.split("&");

				for (const pair of obj) {
					const [key, value] = pair.split("=");
					result[decodeURIComponent(key)] = decodeURIComponent(value);
				}

				body = result;
			} else if (isXML) {
				body = parser.parse(rawData);
			}

			resolve(body);
		});
	});
}

export { parseRequestBody };
