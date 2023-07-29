/**************************************************/
type Glacier = (options: Configuration) => void;

type Configuration = {
	port: number;
	routesDir: string;
};

type RouteHandler = (request: Request, response: Response) => Promise<void> | void;

type RoutingTable = {
	[pathname: string]: {
		before?: RouteHandler;
		main: RouteHandler;
		after?: RouteHandler;
	};
};

type RequestMethod =
	| "GET"
	| "POST"
	| "PUT"
	| "PATCH"
	| "DELETE"
	| "HEAD"
	| "OPTIONS"
	| "TRACE"
	| "CONNECT";

type SharedSendArgs = {
	status?: number;
	headers?: Record<string, string>;
};

interface Request {
	/**
	 * Node.js http.Request. Use Glacier.Request instead unless necessary
	 */
	readonly stdlib: import("http").IncomingMessage;
	readonly method: RequestMethod;
	readonly url: URL;
	readonly body: Record<string, string>;
	readonly query: Record<string, string>;
	readonly params: Record<string, string>;
}

interface Response {
	/**
	 * node.js http.Response
	 * use Glacier.Response instead unless necessary
	 */
	readonly stdlib: import("http").ServerResponse;
	/**
	 *
	 * @param data raw data or path to file
	 * @param options
	 * @returns
	 */
	readonly send: (data: unknown, options?: SharedSendArgs) => void;
	readonly redirect: (url: string) => void;
	/**
	 * custom object to store values in
	 */
	custom?: Record<string, unknown>;
}

/**************************************************/

export { Glacier, Request, Response, RouteHandler, RequestMethod, RoutingTable };
