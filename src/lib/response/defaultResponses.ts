import { Request, Response } from "../../types.js";

const defaultResponses = {
	internalServerError: (_: Request, res: Response) =>
		res.send("<h1>500 - Internal Server Error</h1>", {
			status: 500,
			headers: { "Content-Type": "text/html" },
		}),
	notFound: (_: Request, res: Response) =>
		res.send("<h1>404 - Not Found</h1>", {
			status: 404,
			headers: { "Content-Type": "text/html" },
		}),
};

export { defaultResponses };
