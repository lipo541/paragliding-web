-- Create messages system for Super Admin to User communication

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS public.message_recipients CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;

-- Messages table (Multi-language support)
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Sender (Super Admin)
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Recipient configuration
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('USER', 'ALL_USERS', 'ROLE')),
    recipient_role TEXT CHECK (recipient_role IN ('USER', 'SUPER_ADMIN')),
    
    -- Message content (Rich Text HTML) - Multi-language
    subject_ka TEXT NOT NULL,
    subject_en TEXT,
    subject_ru TEXT,
    subject_ar TEXT,
    subject_de TEXT,
    subject_tr TEXT,
    
    content_ka TEXT NOT NULL,
    content_en TEXT,
    content_ru TEXT,
    content_ar TEXT,
    content_de TEXT,
    content_tr TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Message recipients junction table (tracks who received and read the message)
CREATE TABLE public.message_recipients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Read status
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Unique constraint: one recipient entry per message per user
    UNIQUE(message_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_recipients_user ON public.message_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_message ON public.message_recipients(message_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_unread ON public.message_recipients(user_id, is_read) WHERE is_read = FALSE;

-- Updated at trigger
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_recipients ENABLE ROW LEVEL SECURITY;

-- Messages policies
-- Super Admins can insert messages
DROP POLICY IF EXISTS "Super Admins can create messages" ON public.messages;
CREATE POLICY "Super Admins can create messages"
    ON public.messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
        )
    );

-- Super Admins can view all messages they sent
DROP POLICY IF EXISTS "Super Admins can view their sent messages" ON public.messages;
CREATE POLICY "Super Admins can view their sent messages"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
        ) AND sender_id = auth.uid()
    );

-- Users can view messages they received
DROP POLICY IF EXISTS "Users can view their received messages" ON public.messages;
CREATE POLICY "Users can view their received messages"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.message_recipients
            WHERE message_recipients.message_id = messages.id 
            AND message_recipients.user_id = auth.uid()
        )
    );

-- Super Admins can update their messages
DROP POLICY IF EXISTS "Super Admins can update their messages" ON public.messages;
CREATE POLICY "Super Admins can update their messages"
    ON public.messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
        ) AND sender_id = auth.uid()
    );

-- Super Admins can delete their messages
DROP POLICY IF EXISTS "Super Admins can delete their messages" ON public.messages;
CREATE POLICY "Super Admins can delete their messages"
    ON public.messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
        ) AND sender_id = auth.uid()
    );

-- Message recipients policies
-- Super Admins can insert recipients when creating messages
DROP POLICY IF EXISTS "Super Admins can create message recipients" ON public.message_recipients;
CREATE POLICY "Super Admins can create message recipients"
    ON public.message_recipients FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
        )
    );

-- Users can view their own message recipients
DROP POLICY IF EXISTS "Users can view their own messages" ON public.message_recipients;
CREATE POLICY "Users can view their own messages"
    ON public.message_recipients FOR SELECT
    USING (user_id = auth.uid());

-- Users can update read status of their messages
DROP POLICY IF EXISTS "Users can update their message read status" ON public.message_recipients;
CREATE POLICY "Users can update their message read status"
    ON public.message_recipients FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Super Admins can view all message recipients
DROP POLICY IF EXISTS "Super Admins can view all message recipients" ON public.message_recipients;
CREATE POLICY "Super Admins can view all message recipients"
    ON public.message_recipients FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
        )
    );

-- Function to automatically create message recipients when message is created
DROP FUNCTION IF EXISTS create_message_recipients() CASCADE;
CREATE OR REPLACE FUNCTION create_message_recipients()
RETURNS TRIGGER AS $$
BEGIN
    -- If recipient_type is 'ALL_USERS', insert all users
    IF NEW.recipient_type = 'ALL_USERS' THEN
        INSERT INTO public.message_recipients (message_id, user_id)
        SELECT NEW.id, id FROM auth.users
        WHERE id IN (SELECT id FROM public.profiles);
        
    -- If recipient_type is 'ROLE', insert all users with that role
    ELSIF NEW.recipient_type = 'ROLE' AND NEW.recipient_role IS NOT NULL THEN
        INSERT INTO public.message_recipients (message_id, user_id)
        SELECT NEW.id, id FROM public.profiles
        WHERE role = NEW.recipient_role::user_role;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create recipients after message insert
DROP TRIGGER IF EXISTS after_message_insert ON public.messages;
CREATE TRIGGER after_message_insert
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION create_message_recipients();

-- Function to get unread message count for a user
DROP FUNCTION IF EXISTS get_unread_message_count(UUID);
CREATE OR REPLACE FUNCTION get_unread_message_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.message_recipients
        WHERE user_id = user_uuid AND is_read = FALSE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
