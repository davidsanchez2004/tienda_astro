-- =====================================================
-- Migration: Link guest orders to user on registration
-- When a user registers with an email that has guest orders,
-- automatically assign those orders to the new user account.
-- =====================================================

-- Update handle_new_user to also claim guest orders
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'customer'
  );

  -- Link guest orders to the new user account
  UPDATE public.orders
  SET user_id = NEW.id,
      checkout_type = 'registered',
      updated_at = NOW()
  WHERE guest_email = NEW.email
    AND checkout_type = 'guest'
    AND user_id IS NULL;

  -- Link guest returns to the new user account
  UPDATE public.returns
  SET user_id = NEW.id,
      updated_at = NOW()
  WHERE guest_email = NEW.email
    AND user_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
