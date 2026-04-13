-- Create waitlist table for marketing landing page
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    source VARCHAR(255) DEFAULT 'go.tradelynk.app' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist(email);

-- Create index on source for analytics/filtering
CREATE INDEX IF NOT EXISTS idx_waitlist_source ON public.waitlist(source);

-- Create index on created_at for sorting/filtering by date
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON public.waitlist(created_at);

-- Add comment to table
COMMENT ON TABLE public.waitlist IS 'Waitlist for marketing landing page - tracks early interest in Tradelynk';
COMMENT ON COLUMN public.waitlist.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN public.waitlist.email IS 'User email address (unique, lowercase)';
COMMENT ON COLUMN public.waitlist.source IS 'Source of signup (e.g., go.tradelynk.app)';
COMMENT ON COLUMN public.waitlist.created_at IS 'Timestamp when user joined waitlist (UTC)';

