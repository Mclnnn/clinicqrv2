<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class StudentPortalSSOController extends Controller
{
    /**
     * Redirect the user to the Student Portal authentication page.
     *
     * @return \Symfony\Component\HttpFoundation\RedirectResponse
     */
    public function redirect()
    {
        return Socialite::driver('student_portal')->stateless()->redirect();
    }

    /**
     * Obtain the user information from the Student Portal.
     *
     * @return RedirectResponse
     */
    public function callback(Request $request)
    {
        try {
            $portalUser = Socialite::driver('student_portal')->stateless()->user();
        } catch (\Throwable $e) {
            Log::error('Student Portal SSO Callback Error: ' . $e->getMessage(), [
                'exception' => $e,
            ]);

            return redirect()->route('login')->withErrors([
                'email' => 'Failed to authenticate with Student Portal. Please try again.',
            ]);
        }

        // Validate allowed email domain if configured
        $allowedDomain = config('auth.sso_allowed_domain', 'dssc.edu.ph');
        if ($allowedDomain && !Str::endsWith((string) $portalUser->getEmail(), '@' . $allowedDomain)) {
            Log::warning('SSO blocked for unauthorized domain', [
                'email' => $portalUser->getEmail(),
            ]);

            return redirect()->route('login')->withErrors([
                'email' => 'Access denied. Your email address is not authorized for SSO login. Please use an approved institutional email (@' . $allowedDomain . ').',
            ]);
        }

        $user = $this->findOrCreatePortalUser($portalUser);

        if ($user->status === 'rejected') {
            Log::warning('SSO blocked for rejected user', ['id' => $user->id]);

            return redirect()->route('login')->withErrors([
                'email' => 'Your account has been rejected. Please contact the clinic administrator.',
            ]);
        }

        // Log the user in
        Auth::login($user);
        $request->session()->regenerate();

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'student_portal_sso_login',
            'additional_details' => "{$user->name} signed in using Student Portal SSO.",
            'ip_address' => $request->ip(),
            'timestamp' => now(),
        ]);

        return $this->redirectByRole($user->role);
    }

    /**
     * Locate existing user or provision a new user from Student Portal profile.
     */
    protected function findOrCreatePortalUser($portalUser): User
    {
        $rawUser = method_exists($portalUser, 'getRaw') ? $portalUser->getRaw() : ($portalUser->user ?? []);

        $studentId = $rawUser['Student ID']
            ?? $rawUser['student_id']
            ?? ($portalUser->user['student_id'] ?? null);

        $employeeId = $rawUser['Employee ID']
            ?? $rawUser['employee_id']
            ?? ($portalUser->user['employee_id'] ?? null);

        $email = (string) ($portalUser->getEmail()
            ?: ($rawUser['Email'] ?? $rawUser['email'] ?? ''));

        $name = (string) ($portalUser->getName()
            ?: ($rawUser['FullName'] ?? $rawUser['name'] ?? 'Portal User'));

        // Clean up irregular spacing around comma e.g. "MONTOYA , CARL OHMAR" -> "MONTOYA, CARL OHMAR"
        $name = trim(preg_replace('/\s*,\s*/', ', ', $name));

        $program = $rawUser['Program']
            ?? $rawUser['program']
            ?? ($portalUser->user['program'] ?? null);

        $departmentCode = $rawUser['Department Code']
            ?? $rawUser['department_code']
            ?? ($portalUser->user['department_code'] ?? null);

        $yearLevel = $rawUser['Year Level']
            ?? $rawUser['year_level']
            ?? ($portalUser->user['year_level'] ?? null);

        $college = $rawUser['College']
            ?? $rawUser['college']
            ?? ($portalUser->user['college'] ?? null);

        $collegeCode = $rawUser['College Code']
            ?? $rawUser['college_code']
            ?? ($portalUser->user['college_code'] ?? null);

        // Map department column: Program if available (e.g. "Bachelor of Science in Information Technology"),
        // otherwise Department Code or College
        $department = $program
            ?? $departmentCode
            ?? $college
            ?? ($rawUser['department'] ?? 'General');

        $portalId = (string) ($portalUser->getId() ?: ($studentId ?: $email));
        $userType = $rawUser['user_type'] ?? ($studentId ? 'Student' : ($employeeId ? 'Employee' : 'Student'));

        $user = User::where('school_portal_id', $portalId)
            ->orWhere('email', $email)
            ->when($studentId, fn ($q) => $q->orWhere('student_id', $studentId))
            ->first();

        if ($user) {
            $user->fill([
                'name' => $name ?: $user->name,
                'email' => $email ?: $user->email,
                'auth_provider' => 'student_portal',
                'school_portal_id' => $portalId,
                'school_portal_synced_at' => now(),
                'department' => $department ?: $user->department,
                'program' => $program ?: $user->program,
                'department_code' => $departmentCode ?: $user->department_code,
                'year_level' => $yearLevel ?: $user->year_level,
                'college' => $college ?: $user->college,
                'college_code' => $collegeCode ?: $user->college_code,
            ]);

            // Auto-approve pending accounts authenticating via institutional SSO
            if ($user->status === 'pending') {
                $user->status = 'approved';
            }

            if (!empty($studentId) && empty($user->student_id)) {
                $user->student_id = $studentId;
            }

            if (!empty($employeeId) && empty($user->employee_id)) {
                $user->employee_id = $employeeId;
            }

            if (!empty($userType) && empty($user->user_type)) {
                $user->user_type = $userType;
            }

            $user->save();

            Log::info('Existing user authenticated via Student Portal SSO', ['id' => $user->id]);
        } else {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make(Str::random(40)),
                'auth_provider' => 'student_portal',
                'school_portal_id' => $portalId,
                'school_portal_synced_at' => now(),
                'student_id' => $studentId,
                'employee_id' => $employeeId,
                'user_type' => $userType,
                'department' => $department,
                'program' => $program,
                'department_code' => $departmentCode,
                'year_level' => $yearLevel,
                'college' => $college,
                'college_code' => $collegeCode,
                'role' => 'User',
                'status' => 'approved',
            ]);

            Log::info('New user provisioned via Student Portal SSO', ['id' => $user->id]);
        }

        return $user;
    }

    /**
     * Redirect authenticated user according to their role.
     */
    protected function redirectByRole(?string $role): RedirectResponse
    {
        return match ($role) {
            'Super Admin' => redirect()->route('superadmin.dashboard'),
            'Admin' => redirect()->route('dashboard'),
            'User' => redirect()->route('user.home'),
            default => redirect()->route('user.home'),
        };
    }
}
