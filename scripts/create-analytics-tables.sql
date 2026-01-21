-- Analytics Data Table
CREATE TABLE IF NOT EXISTS analytics_data (
  id BIGSERIAL PRIMARY KEY,
  product_name TEXT NOT NULL,
  date DATE NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_name, date, metric_name)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_analytics_product_date ON analytics_data(product_name, date);
CREATE INDEX IF NOT EXISTS idx_analytics_metric ON analytics_data(metric_name);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics_data(date DESC);

-- RLS Policies (enable row level security)
ALTER TABLE analytics_data ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all data
CREATE POLICY "Allow authenticated read access"
  ON analytics_data
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to insert data
CREATE POLICY "Allow authenticated insert access"
  ON analytics_data
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to update data
CREATE POLICY "Allow authenticated update access"
  ON analytics_data
  FOR UPDATE
  TO authenticated
  USING (true);

-- Policy: Allow service role full access (for imports)
CREATE POLICY "Allow service role all access"
  ON analytics_data
  FOR ALL
  TO service_role
  USING (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_analytics_data_updated_at
  BEFORE UPDATE ON analytics_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
