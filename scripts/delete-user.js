#!/usr/bin/env node

/**
 * Script to completely delete a user from Supabase
 * Usage: node scripts/delete-user.js user@example.com
 */

const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node scripts/delete-user.js user@example.com');
  process.exit(1);
}

// You need to set this in your .env.local file
const ADMIN_KEY = process.env.ADMIN_DELETE_KEY || 'your-secret-admin-key';
const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function checkUser(email) {
  try {
    const response = await fetch(`${API_URL}/api/admin/delete-user?email=${encodeURIComponent(email)}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking user:', error);
    return null;
  }
}

async function deleteUser(email) {
  try {
    const response = await fetch(`${API_URL}/api/admin/delete-user`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': ADMIN_KEY
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete user');
    }
    
    return data;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

async function main() {
  console.log(`\n🔍 Checking user: ${email}\n`);
  
  // First check if user exists
  const userInfo = await checkUser(email);
  
  if (userInfo && userInfo.exists) {
    console.log('User found:');
    console.log('- In user_profiles:', userInfo.in_user_profiles ? '✅' : '❌');
    console.log('- In auth.users:', userInfo.in_auth_users ? '✅' : '❌');
    if (userInfo.has_preferences !== undefined) {
      console.log('- Has preferences:', userInfo.has_preferences ? '✅' : '❌');
    }
    if (userInfo.rankings_count !== undefined) {
      console.log('- Rankings count:', userInfo.rankings_count);
    }
    
    // Confirm deletion
    console.log('\n⚠️  WARNING: This will permanently delete all user data!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('🗑️  Deleting user...\n');
    
    const result = await deleteUser(email);
    
    console.log('✅ Success:', result.message);
    console.log('\nDeleted from:');
    console.log('- auth.users:', result.deletedFrom.auth_users ? '✅' : '❌');
    console.log('- user_profiles:', result.deletedFrom.user_profiles ? '✅' : '❌');
    console.log('- related tables:', result.deletedFrom.related_tables ? '✅' : '❌');
    
  } else {
    console.log('❌ User not found in system');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkUser, deleteUser };