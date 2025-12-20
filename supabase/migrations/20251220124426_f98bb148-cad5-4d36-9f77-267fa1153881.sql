-- Add CHECK constraints for input validation on contact_messages table

-- Add length constraint for name (max 100 chars)
ALTER TABLE public.contact_messages 
ADD CONSTRAINT contact_messages_name_length 
CHECK (char_length(name) <= 100 AND char_length(name) >= 1);

-- Add length constraint for email (max 255 chars) and basic format validation
ALTER TABLE public.contact_messages 
ADD CONSTRAINT contact_messages_email_length 
CHECK (char_length(email) <= 255 AND char_length(email) >= 5);

-- Add email format validation using regex
ALTER TABLE public.contact_messages 
ADD CONSTRAINT contact_messages_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add length constraint for message (max 5000 chars, min 10 chars)
ALTER TABLE public.contact_messages 
ADD CONSTRAINT contact_messages_message_length 
CHECK (char_length(message) <= 5000 AND char_length(message) >= 10);