ALTER TABLE site_config ADD COLUMN available_for_work INTEGER DEFAULT 0;
ALTER TABLE site_config ADD COLUMN availability_text TEXT DEFAULT 'Available for work';