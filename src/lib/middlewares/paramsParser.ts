import { RoutingTable } from "../../types.js";

function paramsParser(routingTable: RoutingTable, pathname: string) {
	const params: Record<string, string> = {};

	for (const staticRoute in routingTable) {
		const staticParts = staticRoute.split("/").filter(Boolean);
		const dynamicParts = pathname.split("/").filter(Boolean);

		if (staticParts.length !== dynamicParts.length) continue;

		let isMatch = true;

		for (let i = 0; i < staticParts.length; i++) {
			const staticPart = staticParts[i];
			const dynamicPart = dynamicParts[i];

			if (staticPart === dynamicPart) continue;

			if (staticPart.startsWith("[") && staticPart.endsWith("]")) {
				const paramName = staticPart.slice(1, -1);
				params[paramName] = dynamicPart;
			} else {
				isMatch = false;
				break;
			}
		}

		if (isMatch) return params;
	}

	return params;
}

export { paramsParser };
