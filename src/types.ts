/**************************************************/
type Glacier = (options: Configuration) => void;

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
	booleans: {
		[key: string]: boolean | (() => boolean);
	};
}
type RouteHandler = (request: Request, response: Response) => Promise<void> | void;

type RoutingTable = {
	[path: string]: {
		before?: RouteHandler;
		main: RouteHandler;
		after?: RouteHandler;
	};
};
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
	readonly send: (data: unknown, options?: sharedSendArgs) => void;
	/**
	 *
	 * @param view raw html or path to html
	 * @param options custom values to be used in templates
	 * @returns void
	 */
	readonly render: (view: string, options: Record<string, unknown>) => void;
	readonly redirect: (url: string) => void;
	readonly download: unknown;

	/**
	 * custom object to store values in
	 */
	custom?: Record<string, unknown>;
}

type Configuration = {
	port: number;
	routesDir: string;
	// defaultMiddlewares?: {
	// 	/**
	// 	 * serve static files/directories
	// 	 * default: ["public", "static"]
	// 	 */
	// 	serveStatic?: boolean | string[];
	// 	/**
	// 	 *
	// 	 * default: undefined
	// 	 */
	// 	templateEngine?: (view: string, data: Record<string, unknown>) => string;
	// 	// bodyParser?: bodyParser;
	// };
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

type sharedSendArgs = {
	/**
	 * default status codes for different occasions:
	 * responded as specified: 200
	 * path didn't match specified routes: 400
	 * unhandled exceptions, rejected promises, thrown errors without a defined status code: 500
	 */
	status?: number;
	headers?: Record<string, string>;
};
/**************************************************/

export { Glacier, Request, Response, RouteHandler, RequestMethod, RoutingTable };
