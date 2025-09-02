-- Add support for PDF original file on floorplans
ALTER TABLE public.floorplans
ADD COLUMN IF NOT EXISTS file_type TEXT NOT NULL DEFAULT 'image',
ADD COLUMN IF NOT EXISTS original_file_url TEXT;