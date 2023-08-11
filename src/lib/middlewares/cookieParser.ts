import { IncomingHttpHeaders } from "http";

function cookieParser(headers: IncomingHttpHeaders) {
	if (!headers.cookie) return undefined;

	return headers.cookie.split(";").reduce<Record<string, string>>((prev, cur) => {
		const [key, value] = cur.trim().split("=");
		prev[key] = decodeURIComponent(value);

		return prev;
	}, {});
}

export { cookieParser };
