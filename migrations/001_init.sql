-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- URLs table
CREATE TABLE IF NOT EXISTS urls (
  id SERIAL PRIMARY KEY,
  short_url VARCHAR(20) UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  alias VARCHAR(20),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Clicks table with extended analytics
CREATE TABLE IF NOT EXISTS clicks (
  id SERIAL PRIMARY KEY,
  short_url VARCHAR(20) NOT NULL,
  ip_address VARCHAR(45),
  country VARCHAR(100),
  city VARCHAR(100),
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  referrer TEXT,
  click_time TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_clicks_urls FOREIGN KEY (short_url) REFERENCES urls(short_url) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_urls_short_url ON urls(short_url);
CREATE INDEX IF NOT EXISTS idx_urls_user_id ON urls(user_id);
CREATE INDEX IF NOT EXISTS idx_clicks_short_url ON clicks(short_url);
CREATE INDEX IF NOT EXISTS idx_clicks_click_time ON clicks(click_time);
CREATE INDEX IF NOT EXISTS idx_clicks_country ON clicks(country);
CREATE INDEX IF NOT EXISTS idx_clicks_device_type ON clicks(device_type);
