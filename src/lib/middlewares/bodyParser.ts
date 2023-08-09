import { IncomingMessage } from "http";
import { XMLParser } from "fast-xml-parser";
import { RequestMethod } from "../../types.js";
const parser = new XMLParser();

function bodyParser(httpReq: IncomingMessage) {
	return new Promise<Record<string, string>>((resolve, reject) => {
		const method = httpReq.method?.toUpperCase() as RequestMethod;
		const methodsWithRequestBody = ["POST", "PUT", "PATCH", "DELETE"];
		if (!methodsWithRequestBody.includes(method)) return resolve({});

		let rawData = "";
		let body = {};

		httpReq.on("data", chunk => (rawData += chunk));
		httpReq.on("error", err => reject(err));
		httpReq.on("end", () => {
			const contentType = httpReq.headers["content-type"];
			const isJSON = contentType?.includes("application/json");
			const isUrlEncodedFormData = contentType?.includes("application/x-www-form-urlencoded");
			const isXML = contentType?.includes("application/xml");

			if (isJSON) {
				body = JSON.parse(rawData);
			} else if (isUrlEncodedFormData) {
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

			return resolve(body);
		});
	});
}

export { bodyParser };
