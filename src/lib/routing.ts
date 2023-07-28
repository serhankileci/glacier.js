import path from "node:path";
import { readdir, stat } from "node:fs/promises";
import { RoutingTable } from "../types.js";
import { pathToFileURL } from "node:url";
const { platform } = process;
const locale = path[platform === "win32" ? "win32" : "posix"];

async function traverseDir(dir: string): Promise<string[]> {
	const files = await readdir(dir);
	const stats = await Promise.all(
		files.map(async file => {
			const fullPath = path.join(dir, file);

			return {
				fullPath,
				isJsFile: path.extname(file) === ".js",
				isDirectory: (await stat(fullPath)).isDirectory(),
			};
		})
	);

	const dirs = [];
	const routeFiles = [];

	for (const { fullPath, isJsFile, isDirectory } of stats) {
		if (isDirectory) {
			dirs.push(fullPath);
		} else if (isJsFile) {
			routeFiles.push(fullPath);
		}
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

		if (!table[localePath]) {
			table[localePath] = {} as RoutingTable[number];
		}

		if (esModule.before) {
			table[localePath].before = esModule.before;
		}

		table[localePath].main = esModule.main;

		if (esModule.after) {
			table[localePath].after = esModule.after;
		}
	}

	return table;
}

export { buildRoutingTable };
