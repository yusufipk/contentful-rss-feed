const express = require("express");
const app = express();
const { createClient } = require("contentful");
const marked = require("marked");

marked.setOptions({
  renderer: new marked.Renderer(),
  pedantic: false,
  gfm: true,
  breaks: false,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  xhtml: true,
});

app.use(express.json());

const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  accessToken: process.env.CONTENTFUL_ACCESS_KEY,
});

const posts = async () => {
  try {
    let res = await client.getEntries({ content_type: "rehber" });
    return res;
  } catch (err) {
    console.log(err);
  }
};

const fetchPosts = async () => {
  let res = await posts();
  return res.items;
};

async function buildRssItems() {
  const items = await fetchPosts();
  return items
    .map((item) => {
      const text = `${marked(item.fields.rehber)}`;
      const summary = item.fields.description;
      const link = `https://teknolojirehberleri.xyz/rehber/${item.fields.slug}`;
      const title = item.fields.title;

      return `
        <entry>
        <title>${title}</title>
	<link href="${link}" />
        <id>${link}</id>
        <updated>${item.sys.updatedAt}</updated>
        <summary>${summary}</summary>
	<content type="xhtml">${text}</content>
	</entry>
        `;
    })
    .join("");
}

app.get("/rss", async (req, res) => {
  const rssFeed = `<?xml version="1.0" encoding="utf-8"?>
  <feed xmlns="http://www.w3.org/2005/Atom">
    <title>teknolojirehberleri.xyz</title>
    <link href="https://teknolojirehberleri.xyz" />
    ${await buildRssItems()}
  </feed>`;

  res.type("application/atom+xml");
  res.send(rssFeed);
});

const port = process.env.port || 3002;
app.listen(port, () => console.log(`Listening on port ${port}...`));
