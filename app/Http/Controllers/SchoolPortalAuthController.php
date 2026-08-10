<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use App\Services\SchoolPortal\SchoolPortalAuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;

class SchoolPortalAuthController extends Controller
{
    public function show()
    {
        return Inertia::render('Auth/SchoolPortalLogin', [
            'demoAccounts' => collect(config('school_portal.dummy_accounts', []))
                ->map(fn (array $account) => [
                    'login' => $account['login'] ?? '',
                    'password' => $account['password'] ?? '',
                    'type' => $account['user_type'] ?? 'Portal user',
                    'department' => $account['department'] ?? null,
                ])
                ->values(),
        ]);
    }

    public function login(Request $request, SchoolPortalAuthService $schoolPortal)
    {
        $request->validate([
            'login' => 'required|string|max:255',
            'password' => 'required|string|min:6',
        ], [
            'login.required' => 'Please enter your school portal email or ID.',
            'password.required' => 'Please enter your school portal password.',
        ]);

        $portalProfile = $schoolPortal->authenticate(
            $request->string('login')->toString(),
            $request->string('password')->toString()
        );

        if ($portalProfile === null) {
            return back()
                ->withInput($request->only('login'))
                ->with('error', 'School portal sign-in failed. Please check your portal credentials.');
        }

        $user = $this->provisionClinicQrUser($portalProfile);

        Auth::login($user);
        $request->session()->regenerate();

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'school_portal_login',
            'additional_details' => "{$user->name} signed in using the school portal connector.",
            'ip_address' => $request->ip(),
            'timestamp' => now(),
        ]);

        return $this->redirectByRole($user->role);
    }

    private function provisionClinicQrUser(array $portalProfile): User
    {
        $user = User::where('school_portal_id', $portalProfile['portal_id'])
            ->orWhere('email', $portalProfile['email'])
            ->first();

        if ($user === null) {
            $user = new User();
            $user->password = Hash::make(Str::random(40));
            $user->role = 'User';
        }

        $user->fill([
            'name' => $portalProfile['name'],
            'email' => $portalProfile['email'],
            'auth_provider' => 'school_portal',
            'school_portal_id' => $portalProfile['portal_id'],
            'school_portal_synced_at' => now(),
            'status' => 'approved',
            'user_type' => $portalProfile['user_type'] ?? $user->user_type,
            'department' => $portalProfile['department'] ?? $user->department,
        ]);

        if (!empty($portalProfile['student_id'])) {
            $user->student_id = $portalProfile['student_id'];
        }

        if (!empty($portalProfile['employee_id'])) {
            $user->employee_id = $portalProfile['employee_id'];
        }

        $user->save();

        return $user;
    }

    private function redirectByRole(string $role)
    {
        return match ($role) {
            'Super Admin' => redirect()->route('superadmin.dashboard'),
            'Admin' => redirect()->route('dashboard'),
            'User' => redirect()->route('user.home'),
            default => redirect('/login'),
        };
    }
}
