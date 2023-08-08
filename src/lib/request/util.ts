function normalizePathname(pathname: string) {
	const repeatingSlashes = /\/{2,}(?!$)/g;
	const trailingSlash = /\/+$/;
	const isNotIndex = pathname !== "/";

	if (isNotIndex && (repeatingSlashes.test(pathname) || trailingSlash.test(pathname))) {
		return pathname.replace(repeatingSlashes, "/").replace(trailingSlash, "") || "/";
	} else {
		return pathname;
	}
}

const requestMethods = [
	"GET",
	"POST",
	"PUT",
	"PATCH",
	"DELETE",
	"HEAD",
	"OPTIONS",
	"TRACE",
	"CONNECT",
] as const;
const contentTypes = ["application/json", "text/plain", "text/html"] as const;

export { normalizePathname, requestMethods, contentTypes };
