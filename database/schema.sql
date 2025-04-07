USE respetisivu;

DROP TABLE IF EXISTS reviews;

CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipe_id VARCHAR(255) NOT NULL,
  user_id INT NOT NULL,
  stars INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
