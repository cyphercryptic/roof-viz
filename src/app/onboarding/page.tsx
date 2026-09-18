import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SetupCompany } from './setup-company';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile, error } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
  if (error) throw new Error('Your account could not be loaded. Please try again.');
  if (profile) redirect('/visualize');
  return <SetupCompany
    companyName={typeof user.user_metadata.company_name === 'string' ? user.user_metadata.company_name : ''}
    fullName={typeof user.user_metadata.full_name === 'string' ? user.user_metadata.full_name : ''}
  />;
}
