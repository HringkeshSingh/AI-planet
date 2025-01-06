exports.up = function (knex) {
  return knex.schema.createTable("documents", (table) => {
    table.increments("id").primary();
    table.string("filename").notNullable();
    table.string("original_filename").notNullable();
    table.string("file_path").notNullable();
    table.integer("file_size");
    table.string("mime_type");
    table.timestamp("upload_date").defaultTo(knex.fn.now());
    table.timestamp("last_accessed");
    table.string("hash").unique().notNullable();
    table.boolean("embedding_cached").defaultTo(false);
    table.jsonb("metadata");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("documents");
};
