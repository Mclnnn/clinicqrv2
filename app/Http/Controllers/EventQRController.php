<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Event;
use App\Models\EventAttendance;
use App\Models\MlRecommendationDecision;
use App\Models\User;
use Inertia\Inertia;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class EventQRController extends Controller
{
    // ── Superadmin: list all events ──
    public function index(Request $request)
    {
        $events = Event::withCount('attendances')
                        ->orderByDesc('event_date')
                        ->get();

        $prefill = null;

        if ($request->filled('ml_decision')) {
            $decision = MlRecommendationDecision::findOrFail($request->integer('ml_decision'));
            $prefill = [
                'ml_recommendation_decision_id' => $decision->id,
                'title' => $decision->complaint_category . ' Prevention Activity',
                'description' => "Created from the {$decision->prediction_month} ML health forecast.\n\nClinic-head action: {$decision->final_action}\n\nML recommendation: {$decision->recommended_action}",
                'category' => $decision->complaint_category,
                'forecast_month' => $decision->prediction_month,
            ];
        }

        return Inertia::render('SuperAdmin/EventQrIndex', [
            'events' => $events,
            'prefill' => $prefill,
        ]);
    }

    // ── Superadmin: create new event ──
    public function store(Request $request)
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'location'    => 'nullable|string|max:255',
            'event_date'  => 'required|date',
            'event_time'  => 'nullable|date_format:H:i',
            'ml_recommendation_decision_id' => 'nullable|exists:ml_recommendation_decisions,id',
        ]);

        $event = Event::create([
            'title'       => $request->title,
            'description' => $request->description,
            'location'    => $request->location,
            'event_date'  => $request->event_date,
            'event_time'  => $request->event_time,
            'status'      => 'active',
            'created_by'  => auth()->id(),
            'ml_recommendation_decision_id' => $request->ml_recommendation_decision_id,
        ]);

    \App\Models\ActivityLog::create([
        'user_id'     => auth()->id(),
        'action'      => 'create_event',
        'additional_details' => auth()->user()->name . " created event: {$event->title}",
        'timestamp'   => now(),
    ]);

        return redirect()->route('superadmin.qr-attendance')
            ->with('success', "Event '{$event->title}' created with QR code.");
    }

    // ── Superadmin: show QR for a specific event ──
    public function showQR(Event $event)
    {
        $qrCode = QrCode::format('svg')
                    ->size(300)
                    ->errorCorrection('H')
                    ->generate($event->scan_url);

        $attendees = $event->attendances()->with('user')->latest()->get();

        return Inertia::render('SuperAdmin/EventQrDetail', [
            'event' => $event,
            'qrCode' => (string) $qrCode,
            'attendees' => $attendees,
        ]);
    }

    // ── Superadmin: delete event ──
    public function destroy(Event $event)
    {
        $title = $event->title;
        $event->delete();

        return redirect()->route('superadmin.qr-attendance')
            ->with('success', "Event '{$title}' deleted.");
    }

    // ── Superadmin: update status ──
    public function updateStatus(Request $request, Event $event)
    {
        $request->validate(['status' => 'required|in:active,ended,cancelled']);
        $event->update(['status' => $request->status]);

        return back()->with('success', 'Event status updated.');
    }

    // ════════════════════════════════════════
    // PUBLIC: Student scans event QR
    // ════════════════════════════════════════

    // Show the attendance check-in page
    public function showAttendanceScan(string $token)
    {
        $event = Event::where('qr_token', $token)
                      ->where('status', 'active')
                      ->firstOrFail();

        return Inertia::render('Attendance/Scan', [
            'event' => $event,
        ]);
    }

    // Process the student ID input
    public function processAttendance(Request $request, string $token)
{
    $event = Event::where('qr_token', $token)
                  ->where('status', 'active')
                  ->firstOrFail();

    $request->validate([
        'student_id' => 'required|string',
    ], [
        'student_id.required' => 'Please enter your Student or Employee ID.',
    ]);

    $id   = trim($request->student_id);
    $user = User::where('student_id', $id)
                ->orWhere('employee_id', $id)
                ->first();

    if (!$user) {
        return back()->with('error', 'ID not found. Please register first.');
    }

    if ($user->status !== 'approved') {
        return back()->with('error', 'Your account is pending approval.');
    }

    $already = EventAttendance::where('event_id', $event->id)
                              ->where('user_id', $user->id)
                              ->exists();

    if ($already) {
        return Inertia::render('Attendance/AlreadyRecorded', [
            'event' => $event,
            'user' => $user,
        ]);
    }

    EventAttendance::create([
        'event_id'   => $event->id,
        'user_id'    => $user->id,
        'student_id' => $id,
        'scanned_at' => now(),
    ]);

    \App\Models\ActivityLog::create([
        'user_id'     => $user->id,
        'action'      => 'event_attendance',
        'additional_details' => "{$user->name} attended event: {$event->title}",
        'timestamp'   => now(),
    ]);

    return Inertia::render('Attendance/Success', [
        'event' => $event,
        'user' => $user,
        'enteredId' => $id,
    ]);
}
}
