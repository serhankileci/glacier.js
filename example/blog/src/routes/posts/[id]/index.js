function main(req, res) {
	const id = req.params.id;
	res.send(`/posts/${id}`);
}

export { main };
