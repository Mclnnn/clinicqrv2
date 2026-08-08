<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Inertia\Inertia;


class AuthController extends Controller
{
    // Show login page
    public function showLogin()
    {
        if (Auth::check()) {
            return $this->redirectByRole(Auth::user()->role);
        }
        return Inertia::render('Auth/Login');
    }

    // Handle login
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|min:6',
        ]);

        $credentials = $request->only('email', 'password');

        if (Auth::attempt($credentials)) {
            $user = Auth::user();

            if ($user->status === 'pending') {
                Auth::logout();
                return redirect()->route('registration.pending');
            }

            $request->session()->regenerate();

            \App\Models\ActivityLog::create([
                'user_id'            => $user->id,
                'action'             => 'login',
                'additional_details' => "{$user->name} logged in as {$user->role}",
                'ip_address'         => $request->ip(),
                'timestamp'          => now(),
            ]);

            return $this->redirectByRole($user->role);
        }

        return back()
            ->withInput($request->only('email'))
            ->with('error', 'Invalid email or password.');
    }

    // Show register page
    public function showRegister()
    {
        if (Auth::check()) {
            return $this->redirectByRole(Auth::user()->role);
        }
        return Inertia::render('Auth/Register');
    }

    // ── Auto-generate Student ID ─────────────────────────────────────────────
    // Format: YYYY-NNNNN  e.g. 2025-00001
    private function generateStudentId(): string
    {
        $year   = now()->format('Y');
        $prefix = $year . '-';

        // Get the highest student_id for this year
        $last = User::where('student_id', 'like', $prefix . '%')
                    ->orderByDesc('student_id')
                    ->value('student_id');

        if ($last) {
            $lastNumber = (int) substr($last, strlen($prefix)); // e.g. 00042 → 42
            $next       = $lastNumber + 1;
        } else {
            $next = 1;
        }

        return $prefix . str_pad($next, 5, '0', STR_PAD_LEFT); // e.g. 2025-00043
    }

    // ── Auto-generate Employee ID ────────────────────────────────────────────
    // Format: EMP-NNNNN  e.g. EMP-00001
    private function generateEmployeeId(): string
    {
        $prefix = 'EMP-';

        $last = User::where('employee_id', 'like', $prefix . '%')
                    ->orderByDesc('employee_id')
                    ->value('employee_id');

        if ($last) {
            $lastNumber = (int) substr($last, strlen($prefix)); // e.g. 00012 → 12
            $next       = $lastNumber + 1;
        } else {
            $next = 1;
        }

        return $prefix . str_pad($next, 5, '0', STR_PAD_LEFT); // e.g. EMP-00013
    }

    // Handle registration
    public function register(Request $request)
    {
        $request->validate([
            'name'           => 'required|string|max:255',
            'email'          => 'required|email|unique:users,email',
            'password'       => 'required|min:8|confirmed',
            'user_type'      => 'required|in:Student,Employee,Staff',
            'department'     => 'required|string|max:255',
            'contact_number' => 'required|string|max:20',
            'date_of_birth'  => 'required|date|before:today',
            'gender'         => 'required|in:Male,Female,Prefer not to say',
            'address'        => 'required|string|max:500',
        ], [
            'name.required'           => 'Full name is required.',
            'email.unique'            => 'This email is already registered.',
            'password.min'            => 'Password must be at least 8 characters.',
            'password.confirmed'      => 'Passwords do not match.',
            'user_type.required'      => 'Please select your user type.',
            'department.required'     => 'Department or course is required.',
            'contact_number.required' => 'Contact number is required.',
            'date_of_birth.required'  => 'Date of birth is required.',
            'date_of_birth.before'    => 'Date of birth must be in the past.',
            'gender.required'         => 'Please select your gender.',
            'address.required'        => 'Home address is required.',
        ]);

        // ── Auto-generate the correct ID based on user type ──────────────────
        $studentId  = null;
        $employeeId = null;

        if ($request->user_type === 'Student') {
            $studentId = $this->generateStudentId();
        } else {
            // Employee or Staff
            $employeeId = $this->generateEmployeeId();
        }

        $user = User::create([
            'name'           => $request->name,
            'email'          => $request->email,
            'password'       => Hash::make($request->password),
            'role'           => 'User',
            'status'         => 'pending',
            'user_type'      => $request->user_type,
            'department'     => $request->department,
            'contact_number' => $request->contact_number,
            'date_of_birth'  => $request->date_of_birth,
            'gender'         => $request->gender,
            'address'        => $request->address,
            'student_id'     => $studentId,
            'employee_id'    => $employeeId,
        ]);

        \App\Models\ActivityLog::create([
            'user_id'            => $user->id,
            'action'             => 'register',
            'additional_details' => "{$user->name} registered as {$user->user_type} ({$user->department}) — ID: " . ($studentId ?? $employeeId),
            'ip_address'         => $request->ip(),
            'timestamp'          => now(),
        ]);

        // 🔔 Notify all Admins & Super Admin
        $admins = User::whereIn('role', ['Admin', 'Super Admin'])->get();
        foreach ($admins as $admin) {
            \DB::table('notifications')->insert([
                'user_id'    => $admin->id,
                'title'      => 'New User Registration 🆕',
                'message'    => $user->name . ' (' . $user->user_type . ' - ' . $user->department . ') registered and is waiting for approval. ID: ' . ($studentId ?? $employeeId),
                'type'       => 'info',
                'link'       => '/superadmin/approvals',
                'is_read'    => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return redirect()->route('registration.pending');
    }

    // Handle logout
    public function logout(Request $request)
    {
        $user = Auth::user();

        if ($user) {
            \App\Models\ActivityLog::create([
                'user_id'            => $user->id,
                'action'             => 'logout',
                'additional_details' => "{$user->name} logged out",
                'ip_address'         => $request->ip(),
                'timestamp'          => now(),
            ]);
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login')->with('success', 'You have been logged out.');
    }

    // Redirect based on role
    private function redirectByRole(string $role)
    {
        return match($role) {
            'Super Admin' => redirect()->route('superadmin.dashboard'),
            'Admin'       => redirect()->route('dashboard'),
            'User'        => redirect()->route('user.home'),
            default       => redirect('/login'),
        };
    }
}
