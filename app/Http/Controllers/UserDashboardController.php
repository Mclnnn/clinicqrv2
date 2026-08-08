<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ClearanceRecord;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserDashboardController extends Controller
{
    public function home()
    {
        $user = auth()->user();

        $totalVisits         = $user->visitLogs()->count();
        $recentVisits        = $user->visitLogs()->latest('timestamp')->take(5)->get();
        $latestClearance     = $user->clearanceRecords()->latest()->first();
        $totalNotes          = $user->visitLogs()->whereNotNull('medical_notes')->count();

        $upcomingAppointment = DB::table('appointments')
            ->where('user_id', $user->id)
            ->where('status', 'Approved')
            ->where('appointment_date', '>=', now())
            ->orderBy('appointment_date')
            ->first();

        return Inertia::render('User/Home', [
            'totalVisits' => $totalVisits,
            'recentVisits' => $recentVisits,
            'latestClearance' => $latestClearance,
            'totalNotes' => $totalNotes,
            'upcomingAppointment' => $upcomingAppointment,
        ]);
    }

    public function index()
    {
        $user = auth()->user();

        $totalVisits     = $user->visitLogs()->count();
        $lastVisit       = $user->visitLogs()->latest('timestamp')->first();
        $recentVisits    = $user->visitLogs()->latest('timestamp')->take(5)->get();
        $clearances      = $user->clearanceRecords()->latest()->take(5)->get();
        $latestClearance = $user->clearanceRecords()->latest()->first();
        $medicalNotes    = $user->visitLogs()->whereNotNull('medical_notes')->latest('timestamp')->take(5)->get();
        $totalNotes      = $user->visitLogs()->whereNotNull('medical_notes')->count();

        return Inertia::render('User/Dashboard', [
            'totalVisits' => $totalVisits,
            'lastVisit' => $lastVisit,
            'recentVisits' => $recentVisits,
            'clearances' => $clearances,
            'latestClearance' => $latestClearance,
            'medicalNotes' => $medicalNotes,
            'totalNotes' => $totalNotes,
        ]);
    }

    public function visits()
    {
        $visits = auth()->user()->visitLogs()->latest('timestamp')->paginate(15);
        return Inertia::render('User/Visits', [
            'visits' => $visits,
        ]);
    }

    public function requestClearance(Request $request)
    {
        $user = auth()->user();

        $hasPending = $user->clearanceRecords()
            ->where('status', 'Pending')
            ->exists();

        if ($hasPending) {
            return back()->with('error', 'You already have a pending clearance request. Please wait for it to be processed.');
        }

        $request->validate([
            'clearance_type' => ['required', 'string', 'max:255'],
        ]);

        ClearanceRecord::create([
            'user_id'        => $user->id,
            'purpose'        => 'Medical Clearance Request',
            'visit_purpose'  => 'Medical Clearance Request',
            'clearance_type' => $request->clearance_type,
            'status'         => 'Pending',
        ]);

        ActivityLog::create([
            'user_id'     => $user->id,
            'action'      => 'request_clearance',
            'description' => $user->name . ' requested a medical clearance.',
            'timestamp'   => now(),
        ]);

        return back()->with('success', 'Clearance request submitted! Please wait for approval.');
    }

    public function downloadClearance($id)
    {
        $user = auth()->user();

        $clearance = $user->clearanceRecords()->findOrFail($id);

        if ($clearance->status !== 'Approved') {
            return back()->with('error', 'Only approved clearances can be downloaded.');
        }

        $html = '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medical Clearance Certificate</title>

    <style>
        @page {
            size: A4;
            margin: 0.5in 1in;
        }

        body {
            font-family: "Times New Roman", Times, serif;
            color: #111;
            margin: 0;
        }

        .page {
            width: 100%;
        }

        .header {
            display: flex;
            align-items: flex-start;
            gap: 14px;
            margin-bottom: 18px;
        }

        .logo img {
            width: 65px;
            height: 65px;
            object-fit: contain;
        }

        .head-text {
            flex: 1;
            text-align: center;
            line-height: 1.25;
            margin-top: 2px;
        }

        .head-text .rp {
            font-size: 14px;
        }

        .head-text .hname {
            font-size: 16px;
            font-weight: 700;
            letter-spacing: 0.3px;
        }

        .head-text .addr {
            font-size: 13px;
        }

        .date-row {
            display: flex;
            justify-content: flex-end;
            margin: 6px 0 12px;
            font-size: 13.5px;
        }

        .date-row .line {
            display: inline-block;
            border-bottom: 1px solid #111;
            min-width: 170px;
            text-align: center;
            padding: 0 6px 2px;
        }

        .title {
            text-align: center;
            font-weight: 700;
            font-size: 18px;
            margin: 14px 0 18px;
            letter-spacing: 0.4px;
            text-decoration: underline;
            text-underline-offset: 3px;
        }

        .body {
            font-size: 14px;
            line-height: 1.6;
        }

        .to {
            margin-bottom: 12px;
        }

        .indent {
            text-indent: 36px;
        }

        .u {
            display: inline-block;
            border-bottom: 1px solid #111;
            min-width: 160px;
            padding: 0 6px 1px;
            line-height: 1.1;
        }

        .u.sm { min-width: 90px; }
        .u.md { min-width: 140px; }
        .u.lg { min-width: 260px; }
        .u.xl { min-width: 360px; }

        .section-title {
            font-weight: 700;
            margin: 16px 0 6px;
            text-transform: uppercase;
            font-size: 13px;
            letter-spacing: 0.5px;
        }

        .boxline {
            border-bottom: 1px solid #111;
            display: block;
            margin: 6px 0 0;
            height: 18px;
        }

        .sign-area {
            margin-top: 55px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 20px;
        }

        .seal {
            width: 140px;
            height: 140px;
            border: 1px dashed #777;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            font-size: 11px;
            color: #444;
        }

        .doc {
            flex: 1;
            text-align: right;
            font-size: 14px;
        }

        .doc .doc-name {
            font-weight: 700;
            text-transform: uppercase;
            display: inline-block;
            border-bottom: 1px solid #111;
            padding: 0 8px 2px;
            min-width: 260px;
            text-align: center;
        }

        .doc .meta {
            margin-top: 8px;
        }

        .sigline {
            margin-top: 22px;
            display: inline-block;
            border-top: 1px solid #111;
            padding-top: 6px;
            min-width: 260px;
            text-align: center;
            font-size: 12.5px;
        }

        @media print {
            a, button {
                display: none !important;
            }
        }
    </style>
</head>

<body>
    <div class="page">
        <div class="header">
            <div class="logo">
                <img src="' . asset('images/clinic/cliniclogo.jpg') . '" alt="Clinic Logo">
            </div>

            <div class="head-text">
                <div class="rp">Republic of the Philippines</div>
                <div class="hname">Davao Del Sur State College | Campus Infirmary and Care Center</div>
                <div class="addr">Matti, Digos City, Davao Del Sur</div>
                <div class="addr">Contact No.: +63-927-184-5869 &nbsp; | &nbsp; Email: DSSCClinicCenter@gmail.com</div>
            </div>
        </div>

        <div class="date-row">
            <div>Date: <span class="line">' . now()->format('F d, Y') . '</span></div>
        </div>

        <div class="title">MEDICAL CLEARANCE CERTIFICATE</div>

        <div class="body">
            <div class="to">To Whom It May Concern:</div>

            <p class="indent">
                This is to certify that Mr./Mrs./Ms.
                <span class="u lg">' . e($user->name) . '</span>,
                <span class="u sm">&nbsp;</span> years old,
                <span class="u sm">&nbsp;</span>,
                a resident of <span class="u xl">&nbsp;</span>,
                has been examined by the undersigned and found
                <span class="u sm">&nbsp;</span>.
            </p>

            <div class="section-title">Patient Information</div>
            <p>
                Full Name: <span class="u xl">' . e($user->name) . '</span><br>
                Age: <span class="u sm">&nbsp;</span> &nbsp;&nbsp;&nbsp;
                Sex: ☐ Male ☐ Female &nbsp;&nbsp;&nbsp;
                Address: <span class="u lg">&nbsp;</span>
            </p>

            <div class="section-title">Medical Findings</div>
            <p>
                <span class="boxline"></span>
                <span class="boxline"></span>
                <span class="boxline"></span>
            </p>

            <div class="section-title">Statement of Clearance</div>
            <p class="indent">
                Based on the history, physical examination, and pertinent findings,
                the patient is hereby declared:
            </p>

            <p>
                ☐ FIT TO WORK &nbsp;&nbsp;&nbsp;
                ☐ FIT TO TRAVEL &nbsp;&nbsp;&nbsp;
                ☐ FIT TO UNDERGO PROCEDURE<br>
                Other/Specify: <span class="u xl">' . e($clearance->clearance_type ?? '') . '</span>
            </p>

            <div class="section-title">Remarks</div>
            <p>
                <span class="boxline"></span>
                <span class="boxline"></span>
            </p>

            <p class="indent" style="margin-top:18px;">
                This certificate is issued upon the request of the interested party for
                <span class="u xl">' . e($clearance->purpose ?? 'Medical Clearance Request') . '</span>.
            </p>

            <div class="sign-area">
                <div class="seal">DRY SEAL<br>PLACEHOLDER</div>

                <div class="doc">
                    <div class="doc-name">DR.</div>
                    <div class="meta">License No.: <span class="u md">&nbsp;</span></div>
                    <div class="meta">PTR No.: <span class="u md">&nbsp;</span></div>
                    <br><br>
                    <div class="sigline">Signature over Printed Name</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>';

        return response($html)
            ->header('Content-Type', 'text/html')
            ->header('Content-Disposition', 'attachment; filename="clearance-' . ($user->student_id ?? $user->id) . '.html"');
    }

    public function updateProfile(Request $request)
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
            $user->update([
                'password' => Hash::make($request->password),
            ]);
        }

        ActivityLog::create([
            'user_id'     => $user->id,
            'action'      => 'update_profile',
            'description' => $user->name . ' updated their profile.',
            'timestamp'   => now(),
        ]);

        return back()->with('success', 'Profile updated successfully!');
    }
}
