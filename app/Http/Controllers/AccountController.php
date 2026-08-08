<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Inertia\Inertia;

class AccountController extends Controller
{
    // Generate next Employee ID automatically
    private function generateEmployeeId(): string
    {
        $last = User::whereNotNull('employee_id')
            ->orderByDesc('id')
            ->value('employee_id');

        if (!$last) {
            return 'EMP-001';
        }

        // Extract the number part e.g. EMP-002 → 2
        $number = (int) str_replace('EMP-', '', $last);
        $next = str_pad($number + 1, 3, '0', STR_PAD_LEFT);

        return 'EMP-' . $next;
    }

    // Show create account form (Admin)
    public function create()
    {
        $nextEmployeeId = $this->generateEmployeeId();
        return Inertia::render('Admin/CreateAccount', [
            'nextEmployeeId' => $nextEmployeeId,
        ]);
    }

    // Store new account (Admin)
    public function store(Request $request)
    {
        $request->validate([
            'name'        => 'required|string|max:255',
            'username'    => 'required|string|unique:users,username',
            'email'       => 'required|email|unique:users,email',
            'role'        => 'required|in:Clinic Staff,Admin',
            'password'    => 'required|min:6|confirmed',
            'employee_id' => 'nullable|string',
        ]);

        User::create([
            'name'        => $request->name,
            'username'    => $request->username,
            'email'       => $request->email,
            'password'    => Hash::make($request->password),
            'role'        => $request->role,
            'employee_id' => $request->employee_id,
            'status'      => 'pending',
            'created_by'  => auth()->id(),
        ]);

        \App\Models\ActivityLog::create([
            'user_id'     => auth()->id(),
            'action'      => 'create_account',
            'description' => auth()->user()->name . ' created a new ' . $request->role . ' account for ' . $request->name . ' — pending approval.',
            'timestamp'   => now(),
        ]);

        // 🔔 Notify all Super Admins
$superAdmins = User::where('role', 'Super Admin')->get();
foreach ($superAdmins as $superAdmin) {
    \DB::table('notifications')->insert([
        'user_id'    => $superAdmin->id,
        'title'      => 'New Account Pending Approval 👤',
        'message'    => auth()->user()->name . ' created a new ' . $request->role . ' account for ' . $request->name . ' (' . $request->email . '). Needs your approval.',
        'type'       => 'info',
        'link'       => '/superadmin/approvals',
        'is_read'    => false,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}

return back()->with('success', 'Account created! Waiting for Super Admin approval.');
    }

    // Show pending approvals (Super Admin)
    public function approvals()
    {
        $pendingUsers = User::where('status', 'pending')->with('createdBy')->latest()->get();
        $allUsers = User::latest()->get();
        return Inertia::render('SuperAdmin/Approvals', [
            'pendingUsers' => $pendingUsers,
            'allUsers' => $allUsers,
        ]);
    }

    // Approve account (Super Admin)
    public function approve($id)
    {
        $user = User::findOrFail($id);
        $user->update(['status' => 'approved']);

        \App\Models\ActivityLog::create([
            'user_id'     => auth()->id(),
            'action'      => 'approve_account',
            'description' => auth()->user()->name . ' approved the account of ' . $user->name,
            'timestamp'   => now(),
        ]);

        if ($user->created_by) {
    \DB::table('notifications')->insert([
        'user_id'    => $user->created_by,
        'title'      => 'Account Approved ✅',
        'message'    => $user->name . "'s account has been approved by Super Admin.",
        'type'       => 'success',
        'link'       => '/admin/create-account',
        'is_read'    => false,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}

        return back()->with('success', $user->name . "'s account has been approved!");
    }

    // Reject account (Super Admin)
    public function reject(Request $request, $id)
    {
        $request->validate(['rejection_reason' => 'required|string']);

        $user = User::findOrFail($id);
        $user->update([
            'status'           => 'rejected',
            'rejection_reason' => $request->rejection_reason,
        ]);

        \App\Models\ActivityLog::create([
            'user_id'     => auth()->id(),
            'action'      => 'reject_account',
            'description' => auth()->user()->name . ' rejected the account of ' . $user->name . '. Reason: ' . $request->rejection_reason,
            'timestamp'   => now(),
        ]);
        // 🔔 Notify the Admin who created this account
if ($user->created_by) {
    \DB::table('notifications')->insert([
        'user_id'    => $user->created_by,
        'title'      => 'Account Rejected ❌',
        'message'    => $user->name . "'s account was rejected. Reason: " . $request->rejection_reason,
        'type'       => 'error',
        'link'       => '/admin/create-account',
        'is_read'    => false,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}

        return back()->with('success', $user->name . "'s account has been rejected.");
    }
    // Update user
public function update(Request $request, $id)
{
    $user = User::findOrFail($id);

    $request->validate([
        'name'     => 'required|string|max:255',
        'username' => 'required|string|unique:users,username,' . $id,
        'email'    => 'required|email|unique:users,email,' . $id,
        'role'     => 'required|in:Clinic Staff,Admin,User',
        'password' => 'nullable|min:6',
    ]);

    $user->update([
        'name'        => $request->name,
        'username'    => $request->username,
        'email'       => $request->email,
        'role'        => $request->role,
        'employee_id' => $request->employee_id,
        'student_id'  => $request->student_id,
    ]);

    if ($request->filled('password')) {
        $user->update(['password' => Hash::make($request->password)]);
    }

    return back()->with('success', $user->name . ' has been updated!');
}

// Delete user
public function destroy($id)
{
    $user = User::findOrFail($id);

    // Hindi pwedeng i-delete ang Super Admin
    if ($user->role === 'Super Admin') {
        return back()->with('error', 'Cannot delete Super Admin!');
    }

    $user->delete();
    return back()->with('success', $user->name . ' has been deleted!');
}
// Show pending user registrations (Admin)
public function userApprovals()
{
    $pendingUsers = User::where('status', 'pending')
        ->where('role', 'User')
        ->latest()
        ->get();

    $allUsers = User::where('role', 'User')->latest()->get();

    return Inertia::render('Admin/UserApprovals', [
        'pendingUsers' => $pendingUsers,
        'allUsers' => $allUsers,
    ]);
}

// Approve user registration (Admin)
public function approveUser($id)
{
    $user = User::findOrFail($id);
    $user->update(['status' => 'approved']);

    // 🔔 Notify the user
    \DB::table('notifications')->insert([
        'user_id'    => $user->id,
        'title'      => 'Account Approved ✅',
        'message'    => 'Your DSSC Clinic account has been approved! You can now log in and access clinic services.',
        'type'       => 'success',
        'link'       => '/user/dashboard',
        'is_read'    => false,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    return back()->with('success', $user->name . "'s account has been approved!");
}

// Reject user registration (Admin)
public function rejectUser(Request $request, $id)
{
    $request->validate(['rejection_reason' => 'required|string']);

    $user = User::findOrFail($id);
    $user->update([
        'status'           => 'rejected',
        'rejection_reason' => $request->rejection_reason,
    ]);

    // 🔔 Notify the user
    \DB::table('notifications')->insert([
        'user_id'    => $user->id,
        'title'      => 'Account Rejected ❌',
        'message'    => 'Your DSSC Clinic account registration was not approved. Reason: ' . $request->rejection_reason,
        'type'       => 'error',
        'link'       => '/login',
        'is_read'    => false,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    return back()->with('success', $user->name . "'s account has been rejected.");
}   
}
