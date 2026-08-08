<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\UserDashboardController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ClearanceController;
use App\Http\Controllers\ClinicQRController;
use App\Http\Controllers\EventQRController;
use App\Http\Controllers\MlRecommendationDecisionController;
use App\Support\ClinicAnalytics;

/*
|--------------------------------------------------------------------------
| ROOT
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    if (auth()->check()) {
        return match (auth()->user()->role) {
            'Super Admin' => redirect()->route('superadmin.dashboard'),
            'Admin'       => redirect()->route('dashboard'),
            default       => redirect()->route('user.home'),
        };
    }

    return Inertia::render('Welcome');
});

/*
|--------------------------------------------------------------------------
| PUBLIC QR ROUTES
|--------------------------------------------------------------------------
|
| These routes must stay outside and above all authenticated/role-protected
| route groups. Phones scanning QR codes are often unauthenticated, and logged
| in users with non-admin roles must also be allowed to open the check-in page.
|
*/
Route::get('/clinic/checkin/{token}', [ClinicQRController::class, 'showCheckin'])->name('clinic.checkin');
Route::post('/clinic/checkin/{token}', [ClinicQRController::class, 'processCheckin'])->name('clinic.checkin.process');

Route::get('/attendance/scan/{token}', [EventQRController::class, 'showAttendanceScan'])->name('attendance.scan');
Route::post('/attendance/scan/{token}', [EventQRController::class, 'processAttendance'])->name('attendance.process');

/*
|--------------------------------------------------------------------------
| AUTH (Guest only)
|--------------------------------------------------------------------------
*/
Route::middleware('guest')->group(function () {

    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);

    Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [AuthController::class, 'register']);

    Route::get('/registration-pending', fn () => Inertia::render('Auth/Pending'))
        ->name('registration.pending');
});

/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/
Route::post('/logout', [AuthController::class, 'logout'])
    ->name('logout')
    ->middleware('auth');

/*
|--------------------------------------------------------------------------
| AUTHENTICATED ROUTES
|--------------------------------------------------------------------------
*/
Route::middleware(['auth'])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | NOTIFICATIONS (ALL ROLES)
    |--------------------------------------------------------------------------
    */
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::get('/notifications/{id}', [NotificationController::class, 'show'])->name('notifications.show');
    Route::post('/notifications/read-all', [NotificationController::class, 'readAll'])->name('notifications.readAll');

    /*
    |--------------------------------------------------------------------------
    | PROFILE (APPROVED USERS ONLY)
    |--------------------------------------------------------------------------
    */
    Route::middleware(['approved'])->group(function () {

        Route::get('/profile', [ProfileController::class, 'index'])->name('profile.index');
        Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::put('/profile/personal', [ProfileController::class, 'updatePersonal'])->name('profile.update-personal');

        Route::post('/profile/photo', [ProfileController::class, 'uploadPhoto'])->name('profile.upload-photo');
        Route::delete('/profile/photo', [ProfileController::class, 'removePhoto'])->name('profile.remove-photo');

        Route::post('/profile/mark-all-read', [ProfileController::class, 'markAllRead'])->name('profile.mark-all-read');
    });

    /*
    |--------------------------------------------------------------------------
    | SUPER ADMIN ONLY
    |--------------------------------------------------------------------------
    */
    Route::middleware(['role:Super Admin'])
        ->prefix('superadmin')
        ->name('superadmin.')
        ->group(function () {

            Route::get('/dashboard', function () {

                // ── Basic stats ──
                $stats = [
                    'total_users'        => DB::table('users')->count(),
                    'total_visits'       => DB::table('visit_logs')->count(),
                    'pending_clearances' => DB::table('clearance_records')->where('status', 'Pending')->count(),
                    'total_activities'   => DB::table('activity_logs')->count(),
                    'visits_today'       => DB::table('visit_logs')->whereDate('created_at', today())->count(),
                    'new_users_today'    => DB::table('users')->whereDate('created_at', today())->count(),
                ];

                // ── Weekly visits — last 7 days ──
                $weeklyLabels = [];
                $weeklyVisits = [];
                for ($i = 6; $i >= 0; $i--) {
                    $date           = now()->subDays($i);
                    $weeklyLabels[] = $date->format('D'); // Mon, Tue...
                    $weeklyVisits[] = DB::table('visit_logs')
                        ->whereDate('created_at', $date->toDateString())
                        ->count();
                }

                // ── Monthly visits — last 6 months ──
                $monthlyLabels = [];
                $monthlyVisits = [];
                for ($i = 5; $i >= 0; $i--) {
                    $date            = now()->subMonths($i);
                    $monthlyLabels[] = $date->format('M Y'); // Jan 2025
                    $monthlyVisits[] = DB::table('visit_logs')
                        ->whereYear('created_at', $date->year)
                        ->whereMonth('created_at', $date->month)
                        ->count();
                }

                // ── User breakdown by user_type ──
                // ── User breakdown ──
$userBreakdown = [
    'Student' => DB::table('users')
        ->where(function ($q) {
            $q->whereRaw("LOWER(TRIM(user_type)) IN ('student', 'students')")
              ->orWhere(function ($qq) {
                  $qq->whereNotNull('student_id')
                     ->where('student_id', '!=', '');
              });
        })
        ->count(),

    'Employee' => DB::table('users')
        ->where(function ($q) {
            $q->whereRaw("LOWER(TRIM(user_type)) IN ('employee', 'employees')")
              ->orWhere(function ($qq) {
                  $qq->whereNotNull('employee_id')
                     ->where('employee_id', '!=', '');
              });
        })
        ->count(),

    'Staff' => DB::table('users')
        ->whereRaw("LOWER(TRIM(user_type)) = 'staff'")
        ->count(),
];
                // ── Recent activity logs ──
                $recentLogs = DB::table('activity_logs')
                    ->leftJoin('users', 'activity_logs.user_id', '=', 'users.id')
                    ->select('activity_logs.*', 'users.name as user_name')
                    ->orderBy('activity_logs.timestamp', 'desc')
                    ->limit(6)
                    ->get();

                // ── Pending clearances ──
                $pendingClearances = DB::table('clearance_records')
    ->leftJoin('users', 'clearance_records.user_id', '=', 'users.id')
    ->select(
        'clearance_records.*',
        'clearance_records.clearance_id as id',
        'users.name as user_name'
    )
    ->where('clearance_records.status', 'Pending')
    ->orderBy('clearance_records.created_at', 'desc')
    ->limit(4)
    ->get();

                $recentUsers = DB::table('users')
                    ->select('id', 'name', 'email', 'role', 'user_type', 'status', 'student_id', 'employee_id', 'created_at')
                    ->latest()
                    ->limit(10)
                    ->get();

                $analytics = ClinicAnalytics::dashboard();
                $mlPredictions = $analytics['mlPredictions'] ?? [];
                $mlDecisions = [];

                if (!empty($mlPredictions['sourceMonth']) && !empty($mlPredictions['predictionMonth'])) {
                    $mlDecisions = DB::table('ml_recommendation_decisions')
                        ->leftJoin('users', 'ml_recommendation_decisions.user_id', '=', 'users.id')
                        ->where('source_month', $mlPredictions['sourceMonth'])
                        ->where('prediction_month', $mlPredictions['predictionMonth'])
                        ->select(
                            'ml_recommendation_decisions.complaint_category',
                            'ml_recommendation_decisions.decision',
                            'ml_recommendation_decisions.final_action as action',
                            'ml_recommendation_decisions.remarks',
                            'ml_recommendation_decisions.updated_at as decided_at',
                            'users.name as decided_by',
                        )
                        ->get()
                        ->keyBy('complaint_category');
                }

                return Inertia::render('SuperAdmin/Dashboard', [
                    'stats' => $stats,
                    'weeklyLabels' => $weeklyLabels,
                    'weeklyVisits' => $weeklyVisits,
                    'monthlyLabels' => $monthlyLabels,
                    'monthlyVisits' => $monthlyVisits,
                    'userBreakdown' => $userBreakdown,
                    'recentLogs' => $recentLogs,
                    'pendingClearances' => $pendingClearances,
                    'recentUsers' => $recentUsers,
                    'analytics' => $analytics,
                    'mlDecisions' => $mlDecisions,
                ]);

            })->name('dashboard');

            Route::get('/monthly-report', fn () => Inertia::render('SuperAdmin/MonthlyReport', [
                'intelligence' => ClinicAnalytics::monthlyIntelligenceReport(),
            ]))->name('monthly-report');

            Route::post('/ml-recommendations/decision', [MlRecommendationDecisionController::class, 'store'])
                ->name('ml-recommendations.decision');
            Route::get('/ml-decision-history', [MlRecommendationDecisionController::class, 'index'])
                ->name('ml-decision-history');

            // Approvals
            Route::get('/approvals', [AccountController::class, 'approvals'])->name('approvals');
            Route::post('/approve/{id}', [AccountController::class, 'approve'])->name('approve');
            Route::post('/reject/{id}', [AccountController::class, 'reject'])->name('reject');

            // QR Clinic
            Route::get('/qr-clinic', [ClinicQRController::class, 'index'])->name('qr-clinic');
            Route::post('/qr-clinic/regenerate', [ClinicQRController::class, 'regenerate'])->name('qr-clinic.regenerate');

            // QR Attendance
            Route::get('/qr-attendance', [EventQRController::class, 'index'])->name('qr-attendance');
            Route::post('/qr-attendance', [EventQRController::class, 'store'])->name('qr-attendance.store');
            Route::get('/qr-attendance/{event}/qr', [EventQRController::class, 'showQR'])->name('qr-attendance.qr');
            Route::patch('/qr-attendance/{event}/status', [EventQRController::class, 'updateStatus'])->name('qr-attendance.status');
            Route::delete('/qr-attendance/{event}', [EventQRController::class, 'destroy'])->name('qr-attendance.destroy');
        });

    /*
    |--------------------------------------------------------------------------
    | ADMIN + SUPER ADMIN
    |--------------------------------------------------------------------------
    */
    Route::middleware(['role:Admin,Super Admin'])->group(function () {

        Route::get('/dashboard', function () {

            $users = DB::table('users')->get();

            $visitLogs = DB::table('visit_logs')
                ->leftJoin('users', 'visit_logs.user_id', '=', 'users.id')
                ->select('visit_logs.*', 'users.name as patient_name', 'users.role')
                ->get();

            $clearanceRecords = DB::table('clearance_records')
                ->leftJoin('users as patients', 'clearance_records.user_id', '=', 'patients.id')
                ->leftJoin('users as signers', 'clearance_records.signed_by', '=', 'signers.id')
                ->leftJoin('visit_logs', 'clearance_records.log_id', '=', 'visit_logs.log_id')
                ->select(
                    'clearance_records.*',
                    'patients.name as patient_name',
                    'signers.name as signer_name',
                    'visit_logs.visit_purpose'
                )
                ->get();

            $activityLogs = DB::table('activity_logs')
                ->leftJoin('users', 'activity_logs.user_id', '=', 'users.id')
                ->select('activity_logs.*', 'users.name as user_name')
                ->orderBy('activity_logs.timestamp', 'desc')
                ->limit(50)
                ->get();

            $stats = [
                'total_users'        => DB::table('users')->count(),
                'total_visits'       => DB::table('visit_logs')->count(),
                'pending_clearances' => DB::table('clearance_records')->where('status', 'Pending')->count(),
                'total_activities'   => DB::table('activity_logs')->count(),
            ];

            return Inertia::render('Admin/Dashboard', [
                'users' => $users,
                'visitLogs' => $visitLogs,
                'clearanceRecords' => $clearanceRecords,
                'activityLogs' => $activityLogs,
                'stats' => $stats,
                'analytics' => ClinicAnalytics::dashboard(),
            ]);
        })->name('dashboard');

        /*
        |--------------------------------------------------------------------------
        | TABLES
        |--------------------------------------------------------------------------
        */
        Route::get('/table/users', fn () =>
            Inertia::render('Tables/Users', [
                'users' => DB::table('users')->get()
            ])
        )->name('table.users');

        Route::get('/table/visit-logs', fn () =>
            Inertia::render('Tables/VisitLogs', [
                'visitLogs' => DB::table('visit_logs')
                    ->leftJoin('users', 'visit_logs.user_id', '=', 'users.id')
                    ->select('visit_logs.*', 'users.name as patient_name')
                    ->get()
            ])
        )->name('table.visit-logs');

        Route::get('/table/clearance-records', fn () =>
            Inertia::render('Tables/Clearances', [
                'clearances' => DB::table('clearance_records')
                    ->leftJoin('users as patients', 'clearance_records.user_id', '=', 'patients.id')
                    ->leftJoin('users as signers', 'clearance_records.signed_by', '=', 'signers.id')
                    ->select('clearance_records.*', 'patients.name as patient_name', 'signers.name as signer_name')
                    ->get()
            ])
        )->name('table.clearance-records');

        Route::get('/table/activity-logs', fn () =>
            Inertia::render('Tables/ActivityLogs', [
                'activityLogs' => DB::table('activity_logs')
                    ->leftJoin('users', 'activity_logs.user_id', '=', 'users.id')
                    ->select('activity_logs.*', 'users.name as user_name')
                    ->orderBy('activity_logs.timestamp', 'desc')
                    ->get()
            ])
        )->name('table.activity-logs');

        /*
        |--------------------------------------------------------------------------
        | ADMIN FEATURES
        |--------------------------------------------------------------------------
        */
        Route::middleware(['approved'])->group(function () {
            Route::get('/admin/create-account', [AccountController::class, 'create'])->name('admin.create-account');
            Route::post('/admin/create-account', [AccountController::class, 'store'])->name('admin.create-account.store');
        });

        // Users
        Route::put('/table/users/{id}', [AccountController::class, 'update'])->name('table.users.update');
        Route::delete('/table/users/{id}', [AccountController::class, 'destroy'])->name('table.users.delete');

        // Approvals
        Route::get('/admin/user-approvals', [AccountController::class, 'userApprovals'])->name('admin.user-approvals');
        Route::post('/admin/user-approvals/{id}/approve', [AccountController::class, 'approveUser'])->name('admin.user-approvals.approve');
        Route::post('/admin/user-approvals/{id}/reject', [AccountController::class, 'rejectUser'])->name('admin.user-approvals.reject');

        // Visit logs
        Route::get('/admin/visit-logs', [AdminController::class, 'visitLogs'])->name('admin.visit-logs');
        Route::post('/admin/visit-logs', [AdminController::class, 'storeVisitLog'])->name('admin.visit-logs.store');
        Route::put('/admin/visit-logs/{id}', [AdminController::class, 'updateVisitLog'])->name('admin.visit-logs.update');
        Route::delete('/admin/visit-logs/{id}', [AdminController::class, 'destroyVisitLog'])->name('admin.visit-logs.destroy');

        // Appointments
        Route::get('/admin/appointments', [AdminController::class, 'appointments'])->name('admin.appointments');
        Route::post('/admin/appointments/{id}/approve', [AdminController::class, 'approveAppointment'])->name('admin.appointments.approve');
        Route::post('/admin/appointments/{id}/reject', [AdminController::class, 'rejectAppointment'])->name('admin.appointments.reject');
        Route::post('/admin/appointments/{id}/complete', [AdminController::class, 'completeAppointment'])->name('admin.appointments.complete');
        Route::post('/admin/appointments/{id}/message', [AdminController::class, 'messageAppointment'])->name('admin.appointments.message');

        // Medicines
        Route::get('/admin/medicines', [AdminController::class, 'medicines'])->name('admin.medicines');
        Route::post('/admin/medicines', [AdminController::class, 'storeMedicine'])->name('admin.medicines.store');
        Route::put('/admin/medicines/{id}', [AdminController::class, 'updateMedicine'])->name('admin.medicines.update');
        Route::delete('/admin/medicines/{id}', [AdminController::class, 'destroyMedicine'])->name('admin.medicines.destroy');

        // Events
        Route::get('/admin/events', [AdminController::class, 'events'])->name('admin.events');
        Route::post('/admin/events', [AdminController::class, 'storeEvent'])->name('admin.events.store');
        Route::put('/admin/events/{id}', [AdminController::class, 'updateEvent'])->name('admin.events.update');
        Route::delete('/admin/events/{id}', [AdminController::class, 'destroyEvent'])->name('admin.events.destroy');

        // Clearances
        Route::get('/admin/clearances', [AdminController::class, 'clearances'])->name('admin.clearances');
        Route::post('/admin/clearances/{id}/approve', [AdminController::class, 'approveClearance'])->name('admin.clearances.approve');
        Route::post('/admin/clearances/{id}/reject', [AdminController::class, 'rejectClearance'])->name('admin.clearances.reject');

        Route::get('/clearance', [ClearanceController::class, 'index'])->name('user.clearances.index');
        Route::post('/clearance', [ClearanceController::class, 'store'])->name('user.clearances.store');
    });

    /*
    |--------------------------------------------------------------------------
    | USER / STUDENT
    |--------------------------------------------------------------------------
    */
    Route::middleware(['role:User', 'approved'])->group(function () {

        Route::get('/user/home', [UserDashboardController::class, 'home'])->name('user.home');
        Route::get('/user/dashboard', [UserDashboardController::class, 'index'])->name('user.dashboard');

        Route::get('/user/visits', [UserDashboardController::class, 'visits'])->name('user.visits');
        Route::post('/user/request-clearance', [UserDashboardController::class, 'requestClearance'])->name('user.request-clearance');
        Route::get('/user/download-clearance/{id}', [UserDashboardController::class, 'downloadClearance'])->name('user.download-clearance');
        Route::put('/user/profile', [UserDashboardController::class, 'updateProfile'])->name('user.update-profile');

        // Appointments
        Route::get('/student/appointments', [StudentController::class, 'appointments'])->name('student.appointments');
        Route::post('/student/appointments', [StudentController::class, 'bookAppointment'])->name('student.book-appointment');
        Route::patch('/student/appointments/{id}/cancel', [StudentController::class, 'cancelAppointment'])->name('student.cancel-appointment');
        Route::get('/student/booked-slots', [StudentController::class, 'getBookedSlots'])->name('student.booked-slots');

        Route::get('/student/medicines', [StudentController::class, 'medicines'])->name('student.medicines');

        Route::get('/student/qr-scan', fn () => Inertia::render('User/QrScan'))->name('student.qr-scan');

        Route::get('/student/symptom-checker', [StudentController::class, 'symptomChecker'])->name('student.symptom-checker');
        Route::post('/student/symptom-checker/analyze', [StudentController::class, 'analyzeSymptoms'])->name('student.symptom-analyze');

        Route::get('/student/events', [StudentController::class, 'events'])->name('student.events');
    });
});
