# Filesystem Routing

<table>
<tr>
	<th>Routes Directory</th>
	<th>Generated Routes</th>
</tr>
<tr>
<td>

```
routes
├── index.ts
├── about.ts
├── foo
│   ├── index.ts
│   └── bar
│       └── index.ts
└── users
    ├── index.ts
    ├── [id]
    │   ├── info.ts
    │   └── posts.ts
    └── baz
        ├── index.ts
        └── about.ts
```
</td>
<td>

```

⟹  /
⟹  /about

⟹  /foo

⟹  /foo/bar

⟹  /users

⟹  /users/:id/info
⟹  /users/:id/posts

⟹  /users/baz
⟹  /users/baz/about
```
</td>
</tr>
</table>
