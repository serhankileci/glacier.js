function normalizePathname(pathname = "/") {
	const repeatingSlashes = /\/{2,}(?!$)/g;
	const trailingSlash = /\/+$/;
	const isNotIndex = pathname !== "/";

	if (isNotIndex && (repeatingSlashes.test(pathname) || trailingSlash.test(pathname))) {
		return pathname.replace(repeatingSlashes, "/").replace(trailingSlash, "") || "/";
	} else {
		return pathname;
	}
}

export { normalizePathname };
