USE vestora;

CREATE TABLE IF NOT EXISTS cart_idempotency_keys (
  user_id BIGINT UNSIGNED NOT NULL,
  idempotency_key CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  operation ENUM('add', 'merge') NOT NULL,
  payload_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, idempotency_key),
  KEY idx_cart_idempotency_created (created_at),
  CONSTRAINT fk_cart_idempotency_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;
