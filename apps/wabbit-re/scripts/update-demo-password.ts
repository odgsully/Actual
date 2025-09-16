import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable.')
  console.error('Please add it to your .env.local file:')
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url')
  process.exit(1)
}

if (!supabaseServiceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable.')
  console.error('Please add it to your .env.local file:')
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
  console.error('\nYou can find this in your Supabase project settings:')
  console.error('1. Go to https://app.supabase.com')
  console.error('2. Select your project')
  console.error('3. Go to Settings > API')
  console.error('4. Copy the "service_role" key (keep this secret!)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function updateDemoPassword() {
  console.log('Updating demo account password...')

  try {
    // First, try to get the existing user
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      return
    }

    const demoUser = users.find(user => user.email === 'support@wabbit-rank.ai')

    if (demoUser) {
      // Update existing user's password
      const { data, error } = await supabase.auth.admin.updateUserById(
        demoUser.id,
        { 
          password: '17026ZvSe!!',
          email_confirm: true
        }
      )

      if (error) {
        console.error('Error updating demo user password:', error)
        return
      }

      console.log('✅ Demo account password updated successfully!')
    } else {
      // Create new demo user if doesn't exist
      console.log('Demo user not found, creating new user...')
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'support@wabbit-rank.ai',
        password: '17026ZvSe!!',
        email_confirm: true,
        user_metadata: {
          firstName: 'Demo',
          lastName: 'User'
        }
      })

      if (authError) {
        console.error('Error creating demo user:', authError)
        return
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: authData.user!.id,
          email: 'support@wabbit-rank.ai',
          first_name: 'Demo',
          last_name: 'User',
          privacy_accepted: true,
          marketing_opt_in: false
        })

      if (profileError) {
        console.error('Error creating user profile:', profileError)
        return
      }

      console.log('✅ Demo account created successfully!')
    }

    console.log('Email: support@wabbit-rank.ai')
    console.log('Password: 17026ZvSe!!')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the update script
updateDemoPassword().then(() => {
  process.exit(0)
}).catch((error) => {
  console.error('Failed to update demo account:', error)
  process.exit(1)
})