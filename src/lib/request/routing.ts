import path from "node:path";
import { readdir, stat } from "node:fs/promises";
import { FStat, RouteHandler, RoutingTable } from "../../types.js";
import { pathToFileURL } from "node:url";
import { defaultResponses } from "../response/index.js";
const { platform } = process;
const locale = path[platform === "win32" ? "win32" : "posix"];

async function fStat(fp: string): Promise<FStat> {
	const fileStat = await stat(fp);
	return {
		fullPath: fp,
		isJsFile: path.extname(fp) === ".js",
		isDirectory: fileStat.isDirectory(),
	};
}

async function traverseDir(dir: string): Promise<string[]> {
	const files = await readdir(dir);
	const promises = files.map(file => fStat(path.join(dir, file)));

	const stats = await Promise.all(promises);

	const dirs = [];
	const routeFiles = [];

	for (const { fullPath, isJsFile, isDirectory } of stats) {
		if (isDirectory) dirs.push(fullPath);
		else if (isJsFile) routeFiles.push(fullPath);
	}

	const subDirs = await Promise.all(dirs.map(traverseDir));
	return routeFiles.concat(...subDirs);
}

async function buildRoutingTable(dir: string) {
	try {
		const table: RoutingTable = {};
		const routeFiles = await traverseDir(dir);

		for (const filePath of routeFiles) {
			let localePath = filePath.split(path.sep).join(locale.sep);
			const esModule: Partial<RoutingTable[number]> = await import(
				pathToFileURL(localePath).toString()
			);

			localePath = localePath
				.replace(".js", "")
				.replace("index", "")
				.replaceAll("\\", "/")
				.replace(dir, "");

			if (localePath !== "/" && localePath.endsWith("/")) {
				localePath = localePath.slice(0, localePath.length - 1);
			}

			if (!esModule.handler) throw new Error("Expected a main 'handler' function.");
			if (!table[localePath]) table[localePath] = {} as RoutingTable[number];

			if (esModule.before) table[localePath].before = esModule.before;
			table[localePath].handler = esModule.handler;
			if (esModule.after) table[localePath].after = esModule.after;
		}

		table["*"] = {
			handler: defaultResponses.notFound,
		};

		return table;
	} catch (err: unknown) {
		console.log(err);
		process.exit(1);
	}
}

async function handleResponseAndMiddlewares(
	pathname: string,
	routingTable: RoutingTable,
	httpHandler: Parameters<RouteHandler>
) {
	const [req, res] = httpHandler;

	if (req.params) {
		for (const [key, value] of Object.entries(req.params)) {
			pathname = pathname.replace(value, `[${key}]`);
		}
	}

	if (!routingTable[pathname]) {
		routingTable["*"].handler(req, res);
		return;
	}

	const { before, handler, after } = routingTable[pathname] || {};

	const pathnames = ["/"].concat(
		pathname
			.split("/")
			.filter(Boolean)
			.map(path => "/" + path)
	);

	for (let i = 0; i < pathnames.length; i++) {
		const leadingRoute = routingTable[pathnames[i]];
		if (leadingRoute?.before) await leadingRoute.before(req, res);
	}

	if (before) await before(req, res);
	await handler(req, res);
	if (after) await after(req, res);

	for (let i = pathnames.length - 1; i >= 0; i--) {
		const leadingRoute = routingTable[pathnames[i]];
		if (leadingRoute?.after) await leadingRoute.after(req, res);
	}
}

export { buildRoutingTable, handleResponseAndMiddlewares };
