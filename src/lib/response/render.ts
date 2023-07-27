import { Response } from "../../types.js";

/*
	adapter for template engines
*/
const render: Response["render"] = (view: string, data: Record<string, unknown>) => {
	// ...
};

export { render };
