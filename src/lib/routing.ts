import path from "node:path";
import { readdir, stat } from "node:fs/promises";
import { RouteHandler, RoutingTable } from "../types.js";
import { pathToFileURL } from "node:url";
import { defaultResponses } from "./response/defaultResponses.js";
const { platform } = process;
const locale = path[platform === "win32" ? "win32" : "posix"];

interface FStat {
	fullPath: string;
	isJsFile: boolean;
	isDirectory: boolean;
}

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
	const table: RoutingTable = {};
	const routeFiles = await traverseDir(dir);

	for (const filePath of routeFiles) {
		let localePath = filePath.split(path.sep).join(locale.sep);
		const esModule = await import(pathToFileURL(localePath).toString());

		localePath = localePath
			.replace(".js", "")
			.replace("index", "")
			.replaceAll("\\", "/")
			.replace(dir, "");

		if (localePath !== "/" && localePath.endsWith("/")) {
			localePath = localePath.slice(0, localePath.length - 1);
		}

		if (!esModule.main) throw "Expected a 'main' HTTP handler function.";
		if (!table[localePath]) table[localePath] = {} as RoutingTable[number];

		if (esModule.before) table[localePath].before = esModule.before;
		table[localePath].main = esModule.main;
		if (esModule.after) table[localePath].after = esModule.after;
	}

	table["*"] = {
		main: defaultResponses.notFound,
	};

	return table;
}

function parseParams(routingTable: RoutingTable, pathname: string) {
	const params: Record<string, string> = {};

	for (const staticRoute in routingTable) {
		const staticParts = staticRoute.split("/").filter(Boolean);
		const dynamicParts = pathname.split("/").filter(Boolean);
		let isMatch = true;

		if (staticParts.length !== dynamicParts.length) continue;

		for (let i = 0; i < staticParts.length; i++) {
			const staticPart = staticParts[i];
			const dynamicPart = dynamicParts[i];

			if (staticPart === dynamicPart) continue;

			if (staticPart.startsWith("[") && staticPart.endsWith("]")) {
				const paramName = staticPart.replace(/[[\]]/g, "");
				params[paramName] = dynamicPart;
			} else {
				isMatch = false;
				break;
			}
		}

		if (isMatch) {
			return params;
		}
	}

	return params;
}

async function routeAndMiddlewareStack(
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

	const { before, main, after } = routingTable[pathname] || {};

	if (!routingTable[pathname]) {
		routingTable["*"].main(req, res);
		return;
	}

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
	await main(req, res);
	if (after) await after(req, res);

	for (let i = pathnames.length - 1; i >= 0; i--) {
		const leadingRoute = routingTable[pathnames[i]];
		if (leadingRoute?.after) await leadingRoute.after(req, res);
	}
}

export { buildRoutingTable, routeAndMiddlewareStack, parseParams };
