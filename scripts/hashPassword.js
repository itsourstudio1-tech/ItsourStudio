/**
 * Password Hashing Utility
 * 
 * Usage: node scripts/hashPassword.js
 * 
 * This script generates bcrypt hashes for passwords.
 * Use it to create hashed passwords for Firestore users.
 */

import bcrypt from 'bcryptjs';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('=================================');
console.log('  Password Hashing Utility');
console.log('  It\'s ouR Studio Admin');
console.log('=================================\n');

rl.question('Enter password to hash: ', async (password) => {
    if (!password || password.length < 6) {
        console.log('\n❌ Password must be at least 6 characters.');
        rl.close();
        return;
    }

    try {
        const salt = await bcrypt.genSalt(12);
        const hash = await bcrypt.hash(password, salt);

        console.log('\n✅ Password hashed successfully!\n');
        console.log('Copy this hash to the Firestore user document:');
        console.log('─'.repeat(60));
        console.log(hash);
        console.log('─'.repeat(60));
        console.log('\nFirestore path: users/{userId}/password');
    } catch (error) {
        console.error('\n❌ Error hashing password:', error.message);
    }

    rl.close();
});
