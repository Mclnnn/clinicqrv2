<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProfileController extends Controller
{
    // Show profile page
    public function index()
    {
       $notifications = \DB::table('notifications')
        ->where('user_id', auth()->id())
        ->latest()
        ->take(10)
        ->get();
    return Inertia::render('User/Profile', [
        'notifications' => $notifications,
    ]);
}
    

    // Update profile info
    public function update(Request $request)
    {
        $user = auth()->user();

        $request->validate([
            'name'     => 'required|string|max:255',
            'username' => 'required|string|unique:users,username,' . $user->id,
            'email'    => 'required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|min:6|confirmed',
        ]);

        $user->update([
            'name'     => $request->name,
            'username' => $request->username,
            'email'    => $request->email,
        ]);

        if ($request->filled('password')) {
            $user->update(['password' => Hash::make($request->password)]);
        }

        return back()->with('success', 'Profile updated successfully!');
    }

    // Upload profile photo
    public function uploadPhoto(Request $request)
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $user = auth()->user();

        // Delete old photo if exists
        if ($user->profile_photo && Storage::disk('public')->exists($user->profile_photo)) {
            Storage::disk('public')->delete($user->profile_photo);
        }

        // Store new photo
        $path = $request->file('photo')->store('profile-photos', 'public');
        $user->update(['profile_photo' => $path]);

        return back()->with('success', 'Profile photo updated!');
    }

    // Remove profile photo
    public function removePhoto()
    {
        $user = auth()->user();

        if ($user->profile_photo && Storage::disk('public')->exists($user->profile_photo)) {
            Storage::disk('public')->delete($user->profile_photo);
        }

        $user->update(['profile_photo' => null]);

        return back()->with('success', 'Profile photo removed.');
    }

    // Get unread notifications count (AJAX)
    public function notificationCount()
    {
        $count = auth()->user()->userNotifications()->where('is_read', false)->count();
        return response()->json(['count' => $count]);
    }

    // Get notifications list (AJAX)
    public function notifications()
    {
        $notifications = auth()->user()->notifications()->latest()->take(10)->get();
        return response()->json($notifications);
    }

    // Mark notification as read
    public function markRead($id)
    {
        auth()->user()->notifications()->findOrFail($id)->update(['is_read' => true]);
        return response()->json(['success' => true]);
    }

    // Mark all as read
    public function markAllRead()
    {
        \DB::table('notifications')
        ->where('user_id', auth()->id())
        ->where('is_read', false)
        ->update(['is_read' => true]);
    return back()->with('success', 'All notifications marked as read.');
    }
    public function updatePersonal(\Illuminate\Http\Request $request)
{
    $user = auth()->user();

    $data = $request->validate([
        'date_of_birth'   => ['nullable', 'date'],
        'gender'          => ['nullable', 'string', 'max:50'],
        'contact_number'  => ['nullable', 'string', 'max:30'],
        'address'         => ['nullable', 'string', 'max:255'],
        'user_type'       => ['nullable', 'string', 'max:50'],
        'department'      => ['nullable', 'string', 'max:255'],
        'student_id'      => ['nullable', 'string', 'max:50'],
        'employee_id'     => ['nullable', 'string', 'max:50'],
    ]);

    $user->update($data);

    return back()->with('success', 'Personal information updated successfully.');
}
}
