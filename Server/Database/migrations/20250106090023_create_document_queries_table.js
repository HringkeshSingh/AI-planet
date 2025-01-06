exports.up = function (knex) {
  return knex.schema.createTable("document_queries", (table) => {
    table.increments("id").primary();
    table
      .integer("document_id")
      .unsigned()
      .references("id")
      .inTable("documents")
      .onDelete("CASCADE");
    table.string("query_text").notNullable();
    table.float("relevance_score");
    table.timestamp("query_date").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("document_queries");
};
