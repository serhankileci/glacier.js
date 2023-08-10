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
		const dirsWithMultiDynamicRoutes: Record<string, string[]> = {};

		for (const filePath of routeFiles) {
			let localePath = filePath.replace(path.sep, locale.sep);
			const esModule: Partial<RoutingTable[number]> = await import(
				pathToFileURL(localePath).toString()
			);

			// normalizing path
			localePath = localePath
				.replace(".js", "")
				.replace("index", "")
				.replaceAll("\\", "/")
				.replace(/\s+/, "-")
				.replace(dir, "");

			// checking dir for multiple dynamic routes
			const parts = localePath.split("/");
			const folder = parts.slice(0, -1).join("/");
			const file = parts.slice(-1)[0];

			if (file.startsWith("[") && file.endsWith("]")) {
				if (!dirsWithMultiDynamicRoutes[folder]) {
					dirsWithMultiDynamicRoutes[folder] = [];
				}

				dirsWithMultiDynamicRoutes[folder].push(file);
			}

			// handling trailing slash
			if (localePath !== "/" && localePath.endsWith("/")) {
				localePath = localePath.slice(0, -1);
			}

			if (!esModule.handler) throw new Error("Expected a main 'handler' function.");
			if (!table[localePath]) table[localePath] = {} as RoutingTable[number];

			if (esModule.before) table[localePath].before = esModule.before;
			table[localePath].handler = esModule.handler;
			if (esModule.after) table[localePath].after = esModule.after;
		}

		const filteredmultiDynamicDirs = Object.entries(dirsWithMultiDynamicRoutes).filter(
			([_, val]) => val.length > 1
		);
		const plural = filteredmultiDynamicDirs.length === 1 ? "y" : "ies";

		if (filteredmultiDynamicDirs.length > 0) {
			throw new Error(
				`
				Found multiple dynamic route files in director${plural}:\n
				${filteredmultiDynamicDirs.map(([dp, fp]) => `${dp}\n- ${fp.join("\n- ")}`).join("\n\n")}\n
				Make sure each folder only has one dynamic route.
				`.replace(/\t+/g, "")
			);
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
