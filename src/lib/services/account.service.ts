import { account } from '../appwrite';

export async function updateProfileName(name: string): Promise<void> {
  await account.updateName(name.trim());
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  if (newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters');
  }
  await account.updatePassword(newPassword, currentPassword);
}
