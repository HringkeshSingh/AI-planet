const knex = require("knex")(require("../Database/knexfile").development);

class Query {
  static async create(documentId, queryText, relevanceScore) {
    const [id] = await knex("document_queries")
      .insert({
        document_id: documentId,
        query_text: queryText,
        relevance_score: relevanceScore,
      })
      .returning("id");
    return id;
  }

  static async getQueriesForDocument(documentId) {
    const queries = await knex("document_queries")
      .where({ document_id: documentId })
      .orderBy("query_date", "desc");
    return queries;
  }
}

module.exports = Query;
