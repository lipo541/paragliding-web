-- Allow users to cancel their own pending bookings
CREATE POLICY "Users can cancel own pending bookings"
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND status = 'pending'
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND status IN ('pending', 'cancelled')
  );
