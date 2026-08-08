<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\ClinicQrToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class ClinicQRController extends Controller
{
    public function index()
    {
        $qrToken = ClinicQrToken::todayToken(auth()->id());
        $scanUrl = $qrToken->scan_url;
        $expiresAt = $qrToken->expires_at;

        $qrCode = QrCode::format('svg')
            ->size(280)
            ->errorCorrection('H')
            ->generate($scanUrl);

        $pastTokens = ClinicQrToken::orderBy('valid_date', 'desc')
            ->take(7)
            ->get();

        return Inertia::render('SuperAdmin/ClinicQr', [
            'qrCode' => (string) $qrCode,
            'scanUrl' => $scanUrl,
            'qrToken' => $qrToken,
            'expiresAt' => $expiresAt,
            'pastTokens' => $pastTokens,
            'isLocalScanUrl' => str_contains($scanUrl, '.test')
                || str_contains($scanUrl, 'localhost')
                || str_contains($scanUrl, '127.0.0.1'),
        ]);
    }

    public function regenerate()
    {
        ClinicQrToken::query()->delete();
        ClinicQrToken::todayToken(auth()->id());

        return redirect()->route('superadmin.qr-clinic')
            ->with('success', 'The clinic QR code has been regenerated successfully.');
    }

    public function showCheckin(string $token)
    {
        $qrToken = ClinicQrToken::where('token', $token)->first();

        if (!$qrToken) {
            return response($this->mobileCheckinHtml(
                title: 'Invalid QR Code',
                body: '<p class="muted">QR code not recognized. Please scan the active clinic QR code shown by the clinic staff.</p>'
            ));
        }

        $action = route('clinic.checkin.process', $token);
        $csrf = csrf_token();
        $message = session('error')
            ? '<div class="alert">'.e(session('error')).'</div>'
            : '';

        return response($this->mobileCheckinHtml(
            title: 'Clinic Check-in',
            body: <<<HTML
                <p class="muted">Enter your Student or Employee ID to log your clinic visit.</p>
                {$message}
                <form method="POST" action="{$action}" class="form" id="checkin-form">
                    <input type="hidden" name="_token" value="{$csrf}">
                    <input type="hidden" name="scan_latitude" id="scan_latitude">
                    <input type="hidden" name="scan_longitude" id="scan_longitude">
                    <input type="hidden" name="scan_accuracy" id="scan_accuracy">
                    <input type="hidden" name="scan_location_status" id="scan_location_status" value="not_requested">
                    <label>Student or Employee ID</label>
                    <input name="student_id" autocomplete="off" required placeholder="e.g. 2026-00001">
                    <label>Purpose</label>
                    <input name="purpose" value="General Check-in">
                    <div class="notice" id="location_notice">Location status: checking...</div>
                    <button type="submit">Check in</button>
                </form>
                <script>
                    const status = document.getElementById('scan_location_status');
                    const notice = document.getElementById('location_notice');
                    if (!navigator.geolocation) {
                        status.value = 'unsupported';
                        notice.textContent = 'Location status: unsupported';
                    } else {
                        navigator.geolocation.getCurrentPosition(
                            position => {
                                document.getElementById('scan_latitude').value = position.coords.latitude;
                                document.getElementById('scan_longitude').value = position.coords.longitude;
                                document.getElementById('scan_accuracy').value = position.coords.accuracy;
                                status.value = 'allowed';
                                notice.textContent = 'Location status: allowed';
                            },
                            () => {
                                status.value = 'denied';
                                notice.textContent = 'Location status: denied';
                            },
                            { enableHighAccuracy: true, timeout: 6000 }
                        );
                    }
                </script>
            HTML
        ));
    }

    public function processCheckin(Request $request, string $token)
    {
        $qrToken = ClinicQrToken::where('token', $token)->first();

        if (!$qrToken || !$qrToken->isValid()) {
            return redirect()->route('clinic.checkin', $token)
                ->with('error', 'This QR code is no longer valid. Please scan the active clinic QR code.');
        }

        $request->validate([
            'student_id' => 'required|string',
            'purpose' => 'nullable|string',
            'scan_latitude' => 'nullable|numeric',
            'scan_longitude' => 'nullable|numeric',
            'scan_accuracy' => 'nullable|numeric',
            'scan_location_status' => 'nullable|string|max:50',
        ], [
            'student_id.required' => 'Please enter your Student or Employee ID.',
        ]);

        $id = trim($request->student_id);

        $user = User::where('student_id', $id)
            ->orWhere('employee_id', $id)
            ->first();

        if (!$user) {
            return response($this->mobileCheckinHtml(
                title: 'ID Not Found',
                body: '<p class="muted">We could not find that Student or Employee ID. Please ask clinic staff to verify your account before checking in.</p><a class="button" href="'.e(route('clinic.checkin', $token)).'">Try again</a>'
            ), 422);
        }

        if ($user->status !== 'approved') {
            return response($this->mobileCheckinHtml(
                title: 'Account Not Approved',
                body: '<p class="muted">Your account is not approved yet. Please ask clinic staff or an administrator for assistance.</p><a class="button" href="'.e(route('clinic.checkin', $token)).'">Try again</a>'
            ), 403);
        }

        DB::table('visit_logs')->insert([
            'user_id' => $user->id,
            'visit_purpose' => $request->purpose ?? 'General Check-in',
            'qr_scanned' => true,
            'verification_status' => 'Verified',
            'scan_latitude' => $request->scan_latitude,
            'scan_longitude' => $request->scan_longitude,
            'scan_accuracy' => $request->scan_accuracy,
            'scan_location_status' => $request->scan_location_status ?? 'not_requested',
            'timestamp' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $locationDetails = $request->filled('scan_latitude') && $request->filled('scan_longitude')
            ? " Location: {$request->scan_latitude}, {$request->scan_longitude} (accuracy: {$request->scan_accuracy}m)."
            : " Location status: " . ($request->scan_location_status ?? 'not_requested') . ".";

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'clinic_checkin',
            'additional_details' => "{$user->name} checked in at the clinic via QR scan." . $locationDetails,
            'ip_address' => $request->ip(),
            'timestamp' => now(),
        ]);

        return response($this->mobileCheckinHtml(
            title: 'Check-in Successful',
            body: '<p class="muted">Thank you, '.e($user->name).'. Your clinic visit has been logged. You may close this page.</p>'
        ));
    }

    private function mobileCheckinHtml(string $title, string $body): string
    {
        return <<<HTML
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>{$title} - ClinicQR</title>
                <style>
                    * { box-sizing: border-box; }
                    body {
                        margin: 0;
                        min-height: 100vh;
                        background: #020716;
                        color: #fff;
                        font-family: Arial, sans-serif;
                        display: grid;
                        place-items: center;
                        padding: 20px;
                    }
                    .card {
                        width: min(100%, 430px);
                        border: 1px solid rgba(255,255,255,.12);
                        background: #111827;
                        border-radius: 8px;
                        padding: 24px;
                        box-shadow: 0 24px 70px rgba(0,0,0,.35);
                    }
                    .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
                    .logo {
                        display: grid;
                        place-items: center;
                        width: 44px;
                        height: 44px;
                        border-radius: 8px;
                        background: #2563eb;
                        font-weight: 900;
                    }
                    .brand-text { font-size: 24px; font-weight: 900; }
                    .brand-text span { color: #60a5fa; }
                    h1 { margin: 0; font-size: 28px; line-height: 1.1; }
                    .muted { color: rgba(255,255,255,.58); line-height: 1.6; margin: 12px 0 22px; }
                    .form { display: grid; gap: 12px; }
                    label { font-size: 13px; font-weight: 800; color: rgba(255,255,255,.72); }
                    input {
                        width: 100%;
                        border: 1px solid rgba(255,255,255,.14);
                        background: rgba(255,255,255,.06);
                        color: #fff;
                        border-radius: 8px;
                        padding: 14px;
                        font-size: 16px;
                    }
                    .notice {
                        border: 1px solid rgba(96,165,250,.28);
                        background: rgba(37,99,235,.12);
                        color: #bfdbfe;
                        border-radius: 8px;
                        padding: 12px;
                        font-size: 14px;
                    }
                    .alert {
                        border: 1px solid rgba(251,113,133,.35);
                        background: rgba(244,63,94,.12);
                        color: #fecdd3;
                        border-radius: 8px;
                        padding: 12px;
                        margin-bottom: 16px;
                        line-height: 1.5;
                    }
                    button, .button {
                        display: block;
                        width: 100%;
                        border: 0;
                        border-radius: 8px;
                        background: #2563eb;
                        color: #fff;
                        padding: 14px;
                        font-size: 16px;
                        font-weight: 900;
                        text-align: center;
                        text-decoration: none;
                    }
                </style>
            </head>
            <body>
                <main class="card">
                    <div class="brand">
                        <div class="logo">CQ</div>
                        <div class="brand-text">Clinic<span>QR</span></div>
                    </div>
                    <h1>{$title}</h1>
                    {$body}
                </main>
            </body>
            </html>
        HTML;
    }
}
