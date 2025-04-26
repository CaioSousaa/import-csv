import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { sql } from "./db/client.ts";
import { stringify } from "csv-stringify";
import { createWriteStream } from "node:fs";

const query = sql`
    SELECT id, name
    FROM products
    WHERE price_in_cents >= 1000
`;

const cursor = query.cursor(10);

const exampleStream = new Transform({
  objectMode: true,
  transform(chunck, encoding, callback) {
    for (const item of chunck) {
      this.push(item);
    }

    callback();
  },
});

await pipeline(
  cursor,
  exampleStream,
  stringify({
    delimiter: ",",
    header: true,
    columns: [
      { key: "id", header: "ID" },
      { key: "name", header: "Name" },
    ],
  }),
  createWriteStream("./export.csv", "utf-8")
);

await sql.end();
