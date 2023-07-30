import { IncomingMessage, ServerResponse } from "node:http";
import { Request, Response } from "../../types.js";

const headers = { "Content-Type": "text/html" };
const defaultResponses = {
	internalServerError: (err: string, _: IncomingMessage, res: ServerResponse) => {
		res.writeHead(500, headers);
		res.end(`<h1>500 - Internal Server Error</h1><p>${err}</p>`);
	},
	notFound: (_: Request, res: Response) => {
		res.send("<h1>404 - Not Found</h1>", { status: 404, headers });
	},
};

export { defaultResponses };
