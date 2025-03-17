// JavaScript for profile.html

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await loadUserProfile();
});

async function loadUserProfile() {
    const user = await getCurrentUser();
    if (user) {
        // Update form fields
        document.getElementById('display_name').value = user.display_name || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('phone').value = user.phone || '';
        document.getElementById('created_at').value = new Date(user.created_at).toLocaleDateString();
        
        // Update status info
        document.getElementById('member-since').textContent = new Date(user.created_at).toLocaleDateString();
        document.getElementById('last-login').textContent = new Date().toLocaleDateString();

        // Load profile image
        await loadProfileImage(user.id);
    }
}

// Handle profile image upload
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('photo-upload').addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const user = await getCurrentUser();
            if (!user) throw new Error('No user logged in');

            // Upload to Supabase Storage
            const { data, error } = await supabaseClient
                .storage
                .from('avatars')
                .upload(`${user.id}/profile.jpg`, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) throw error;

            // Reload profile image
            await loadProfileImage(user.id);
            
        } catch (error) {
            console.error('Error uploading profile image:', error);
            alert('Failed to upload profile image. Please try again.');
        }
    });
});

async function loadProfileImage(userId) {
    try {
        // Try to get the profile image URL
        const { data } = await supabaseClient
            .storage
            .from('avatars')
            .getPublicUrl(`${userId}/profile.jpg`);

        if (data?.publicUrl) {
            // Test if the image exists by loading it
            const img = new Image();
            img.onload = () => {
                document.getElementById('profile-image').src = data.publicUrl;
            };
            img.onerror = () => {
                // If image doesn't exist, use default avatar
                const email = document.getElementById('email').value;
                document.getElementById('profile-image').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=0D8ABC&color=fff`;
            };
            img.src = data.publicUrl;
        }
    } catch (error) {
        console.error('Error loading profile image:', error);
    }
}

// Handle profile form submission
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('profile-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        
        try {
            const user = await getCurrentUser();
            if (!user) throw new Error('No user logged in');

            const updatedData = {
                display_name: document.getElementById('display_name').value,
                phone: document.getElementById('phone').value
            };

            const { error } = await supabaseClient
                .from('users')
                .update(updatedData)
                .eq('id', user.id);

            if (error) throw error;

            // Update session storage
            const updatedUser = { ...user, ...updatedData };
            sessionStorage.setItem('user', JSON.stringify(updatedUser));
            currentUser = updatedUser;

            alert('Profile updated successfully!');
            
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        }
    });
});

// Handle password form submission
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('password-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        
        try {
            const user = await getCurrentUser();
            if (!user) throw new Error('No user logged in');

            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            // Verify current password
            const { data: verifyUser, error: verifyError } = await supabaseClient
                .from('users')
                .select('id')
                .eq('id', user.id)
                .eq('password', currentPassword)
                .single();

            if (verifyError || !verifyUser) {
                throw new Error('Current password is incorrect');
            }

            if (newPassword !== confirmPassword) {
                throw new Error('New passwords do not match');
            }

            // Update password
            const { error } = await supabaseClient
                .from('users')
                .update({ password: newPassword })
                .eq('id', user.id);

            if (error) throw error;

            alert('Password updated successfully!');
            document.getElementById('password-form').reset();
            
        } catch (error) {
            console.error('Error updating password:', error);
            alert(error.message || 'Failed to update password. Please try again.');
        }
    });
});

async function handleLogout() {
    await logout();
} 