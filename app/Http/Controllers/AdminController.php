<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Appointment;
use App\Models\Medicine;
use App\Models\Event;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminController extends Controller
{
    // ===================== VISIT LOGS =====================

    public function visitLogs(Request $request)
    {
        $search = $request->get('search');
        $query = DB::table('visit_logs')
            ->leftJoin('users', 'visit_logs.user_id', '=', 'users.id')
            ->select('visit_logs.*', 'users.name as patient_name', 'users.student_id')
            ->orderBy('visit_logs.timestamp', 'desc');

        if ($search) $query->where('users.name', 'like', "%$search%");

        $visits = $query->paginate(15)->withQueryString();
        $users = User::where('role', 'User')->orderBy('name')->get();
        return Inertia::render('Admin/VisitLogs', [
            'visits' => $visits,
            'users' => $users->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'student_id' => $user->student_id,
                'employee_id' => $user->employee_id,
            ]),
            'search' => $search,
        ]);
    }

    public function storeVisitLog(Request $request)
    {
        $request->validate([
            'user_id'       => 'required|exists:users,id',
            'visit_date'    => 'required|date',
            'visit_time'    => 'required',
            'visit_purpose' => 'nullable|string',
            'medical_notes' => 'nullable|string',
        ]);

        DB::table('visit_logs')->insert([
            'user_id'             => $request->user_id,
            'visit_purpose'       => $request->visit_purpose,
            'medical_notes'       => $request->medical_notes,
            'verification_status' => $request->verification_status ?? 'Verified',
            'timestamp'           => $request->visit_date . ' ' . $request->visit_time . ':00',
            'created_at'          => now(),
            'updated_at'          => now(),
        ]);

        return back()->with('success', ' added successfully.');
    }

   public function updateVisitLog(Request $request, $id)
{
    \DB::table('visit_logs')->where('log_id', $id)->update([
        'visit_purpose'       => $request->visit_purpose ?? 'General Check-in', // ← null-safe
        'medical_notes'       => $request->medical_notes ?? null,
        'verification_status' => $request->verification_status ?? 'Pending',
        'timestamp'           => $request->visit_date . ' ' . ($request->visit_time ?? '00:00') . ':00',
        'updated_at'          => now(),
    ]);

    return redirect()->route('admin.visit-logs')->with('success', 'Visit log updated successfully.');
}

    public function destroyVisitLog($id)
    {
        DB::table('visit_logs')->where('log_id', $id)->delete();
        return back()->with('success', 'Visit record deleted.');
    }

    // ===================== APPOINTMENTS =====================

    public function appointments(Request $request)
    {
        $status = $request->get('status', 'all');
        $query = Appointment::with('user')->latest();
        if ($status !== 'all') $query->where('status', $status);
        $appointments = $query->paginate(15)->withQueryString()->through(fn (Appointment $appointment) => [
            'id' => $appointment->id,
            'appointment_type' => $appointment->appointment_type,
            'appointment_date' => $appointment->appointment_date,
            'appointment_time' => $appointment->appointment_time,
            'status' => $appointment->status,
            'notes' => $appointment->notes,
            'admin_comment' => $appointment->admin_comment,
            'rejection_reason' => $appointment->rejection_reason,
            'created_at' => optional($appointment->created_at)->toDateTimeString(),
            'user' => $appointment->user ? [
                'id' => $appointment->user->id,
                'name' => $appointment->user->name,
                'student_id' => $appointment->user->student_id,
                'employee_id' => $appointment->user->employee_id,
                'email' => $appointment->user->email,
            ] : null,
        ]);

        return Inertia::render('Admin/Appointments', [
            'appointments' => $appointments,
            'status' => $status,
            'statusOptions' => ['all', 'Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled'],
        ]);
    }

    public function approveAppointment(Request $request, $id)
    {
        $appointment = Appointment::findOrFail($id);
        $appointment->update([
            'status'        => 'Approved',
            'approved_by'   => auth()->id(),
            'admin_comment' => $request->comment,
        ]);

        $message = 'Your ' . $appointment->appointment_type . ' appointment on ' .
            \Carbon\Carbon::parse($appointment->appointment_date)->format('M d, Y') . ' has been approved.';
        if ($request->comment) $message .= ' Note: ' . $request->comment;

        DB::table('notifications')->insert([
            'user_id'    => $appointment->user_id,
            'title'      => 'Appointment Approved ✅',
            'message'    => $message,
            'type'       => 'success',
            'is_read'    => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return back()->with('success', 'Appointment approved successfully.');
    }

    public function rejectAppointment(Request $request, $id)
    {
        $request->validate(['comment' => 'required|string']);
        $appointment = Appointment::findOrFail($id);
        $appointment->update([
            'status'           => 'Rejected',
            'rejection_reason' => $request->comment,
            'admin_comment'    => $request->comment,
        ]);

        DB::table('notifications')->insert([
            'user_id'    => $appointment->user_id,
            'title'      => 'Appointment Rejected ❌',
            'message'    => 'Your ' . $appointment->appointment_type . ' appointment was rejected. Reason: ' . $request->comment,
            'type'       => 'error',
            'is_read'    => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return back()->with('success', 'Appointment rejected.');
    }

    public function messageAppointment(Request $request, $id)
    {
        $request->validate(['message' => 'required|string']);
        $appointment = Appointment::with('user')->findOrFail($id);

        DB::table('notifications')->insert([
            'user_id'    => $appointment->user_id,
            'title'      => 'Message from Clinic',
            'message'    => $request->message,
            'type'       => 'info',
            'is_read'    => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return back()->with('success', 'Message sent to ' . ($appointment->user->name ?? 'student') . '.');
    }

    public function completeAppointment(Request $request, $id)
    {
        $appointment = Appointment::findOrFail($id);
        $appointment->update([
            'status'        => 'Completed',
            'admin_comment' => $request->comment,
        ]);

        if ($request->comment) {
            DB::table('notifications')->insert([
                'user_id'    => $appointment->user_id,
                'title'      => 'Appointment Completed ☑️',
                'message'    => 'Your appointment has been marked as completed. Note: ' . $request->comment,
                'type'       => 'info',
                'is_read'    => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return back()->with('success', 'Appointment marked as completed.');
    }

    // ===================== MEDICINES =====================

    public function medicines()
    {
        $medicines = Medicine::latest()->paginate(15)->withQueryString()->through(fn (Medicine $medicine) => [
            'id' => $medicine->id,
            'name' => $medicine->name,
            'category' => $medicine->category,
            'description' => $medicine->description,
            'usage' => $medicine->usage,
            'quantity' => $medicine->quantity,
            'is_available' => $medicine->is_available,
            'status' => $medicine->status,
            'created_at' => optional($medicine->created_at)->toDateTimeString(),
        ]);

        return Inertia::render('Admin/Medicines', [
            'medicines' => $medicines,
            'categoryGroups' => [
                'Pain & Fever Management' => ['Analgesics', 'Antipyretics', 'Anti-inflammatory Drugs', 'Muscle Relaxants', 'Anesthetics'],
                'Infectious Diseases' => ['Antibiotics', 'Antivirals', 'Antifungals', 'Antiparasitics', 'Vaccines'],
                'Respiratory System' => ['Antihistamines', 'Decongestants', 'Bronchodilators', 'Respiratory Drugs'],
                'Gastrointestinal System' => ['Gastrointestinal Drugs', 'Antiemetics', 'Laxatives'],
                'Skin, Eye, Ear' => ['Dermatologic Drugs', 'Ophthalmic Drugs', 'Otic Drugs'],
                'Supplements & Nutrition' => ['Nutritional Supplements'],
                'General' => ['Other'],
            ],
        ]);
    }

    public function storeMedicine(Request $request)
    {
        $request->validate([
            'name'        => 'required|string|max:255',
            'category'    => 'required|string',
            'description' => 'nullable|string',
            'usage'       => 'nullable|string',
            'quantity'    => 'required|integer|min:0',
        ]);

        $quantity = (int) $request->quantity;

        Medicine::create([
            'name'        => $request->name,
            'category'    => $request->category,
            'description' => $request->description,
            'usage'       => $request->usage,
            'quantity'    => $quantity,
            'is_available' => $quantity > 0,
        ]);

        return back()->with('success', 'Medicine added successfully.');
    }

    public function updateMedicine(Request $request, $id)
    {
        $request->validate([
            'name'        => 'required|string|max:255',
            'category'    => 'required|string',
            'description' => 'nullable|string',
            'usage'       => 'nullable|string',
            'quantity'    => 'required|integer|min:0',
        ]);

        $quantity = (int) $request->quantity;

        Medicine::findOrFail($id)->update([
            'name'        => $request->name,
            'category'    => $request->category,
            'description' => $request->description,
            'usage'       => $request->usage,
            'quantity'    => $quantity,
            'is_available' => $quantity > 0,
        ]);

        return back()->with('success', 'Medicine updated successfully.');
    }

    public function destroyMedicine($id)
    {
        Medicine::findOrFail($id)->delete();
        return back()->with('success', 'Medicine deleted.');
    }

    // ===================== EVENTS =====================

    public function events()
    {
        $events = Event::latest()->paginate(15)->withQueryString();
        return Inertia::render('Admin/Events', [
            'events' => $events,
        ]);
    }

    public function storeEvent(Request $request)
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'event_date'  => 'required|date',
            'event_time'  => 'nullable|string',
            'location'    => 'nullable|string',
            'category'    => 'nullable|string',
        ]);

        Event::create([
            'title'       => $request->title,
            'description' => $request->description,
            'event_date'  => $request->event_date,
            'event_time'  => $request->event_time,
            'location'    => $request->location,
            'category'    => $request->category ?? 'General',
            'status'      => 'Upcoming',
            'created_by'  => auth()->id(),
        ]);

        return back()->with('success', 'Event created successfully.');
    }

    public function updateEvent(Request $request, $id)
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'event_date'  => 'required|date',
            'event_time'  => 'nullable|string',
            'location'    => 'nullable|string',
            'category'    => 'nullable|string',
            'status'      => 'required|in:Upcoming,Ongoing,Completed,Cancelled',
        ]);

        Event::findOrFail($id)->update($request->only([
            'title', 'description', 'event_date', 'event_time', 'location', 'category', 'status'
        ]));

        return back()->with('success', 'Event updated successfully.');
    }

    public function destroyEvent($id)
    {
        Event::findOrFail($id)->delete();
        return back()->with('success', 'Event deleted.');
    }

    // ===================== CLEARANCE =====================
    // ✅ FIXED: use clearance_id, not id

    public function clearances(Request $request)
{
    $status = $request->get('status', 'all');

    $query = DB::table('clearance_records')
        ->leftJoin('users', 'clearance_records.user_id', '=', 'users.id')
        ->select(
            'clearance_records.*',
            'clearance_records.clearance_id as id',   // ✅ ADD THIS
            'users.name as patient_name',
            'users.student_id'
        )
        ->latest('clearance_records.created_at');

    if ($status !== 'all') {
        $query->where('clearance_records.status', $status);
    }

    $clearances = $query->paginate(15)->withQueryString();

    return Inertia::render('Admin/Clearances', [
        'clearances' => $clearances,
        'status' => $status,
        'statusOptions' => ['all', 'Pending', 'Approved', 'Rejected'],
    ]);
}

public function approveClearance($id)
{
   DB::table('clearance_records')->where('clearance_id', $id)->update([
        'status'     => 'Approved',
        'signed_by'  => auth()->id(),
        'updated_at' => now(),
    ]);

  $clearance = DB::table('clearance_records')->where('clearance_id', $id)->first();

    DB::table('notifications')->insert([
        'user_id'    => $clearance->user_id,
        'title'      => 'Clearance Approved',
        'message'    => 'Your medical clearance request has been approved. You can now download your clearance.',
        'type'       => 'success',
        'is_read'    => false,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    return back()->with('success', 'Clearance approved.');
}

public function rejectClearance(Request $request, $id)
{
    $request->validate(['rejection_reason' => 'required|string']);

    DB::table('clearance_records')->where('clearance_id', $id)->update([
        'status'           => 'Rejected',
        'rejection_reason' => $request->rejection_reason,
        'updated_at'       => now(),
    ]);

    $clearance = DB::table('clearance_records')->where('clearance_id', $id)->first();

    DB::table('notifications')->insert([
        'user_id'    => $clearance->user_id,
        'title'      => 'Clearance Rejected',
        'message'    => 'Your clearance request was rejected. Reason: ' . $request->rejection_reason,
        'type'       => 'error',
        'is_read'    => false,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    return back()->with('success', 'Clearance rejected.');
}
}
