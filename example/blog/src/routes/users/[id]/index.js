function main(req, res) {
	const id = req.params.id;
	res.send(`/users/${id}`);
}

export { main };
