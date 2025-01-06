const pool = require("../Database/database");

class Document {
  static async create(data) {
    const {
      filename,
      originalFilename,
      filePath,
      fileSize,
      mimeType,
      hash,
      metadata,
    } = data;
    const query = `
            INSERT INTO documents (
                filename, original_filename, file_path, file_size, 
                mime_type, hash, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `;

    const values = [
      filename,
      originalFilename,
      filePath,
      fileSize,
      mimeType,
      hash,
      JSON.stringify(metadata),
    ];

    const result = await pool.query(query, values);
    return result.rows[0].id;
  }

  static async updateEmbeddingStatus(id, status) {
    const query = `
            UPDATE documents
            SET embedding_cached = $1
            WHERE id = $2
        `;
    await pool.query(query, [status, id]);
  }

  static async findByHash(hash) {
    const query = `
            SELECT * FROM documents
            WHERE hash = $1
        `;
    const result = await pool.query(query, [hash]);
    return result.rows[0];
  }

  static async getAllDocuments() {
    const query = `
            SELECT * FROM documents
            ORDER BY upload_date DESC
        `;
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = Document;
