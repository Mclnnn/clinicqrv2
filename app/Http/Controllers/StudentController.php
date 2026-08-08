<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

use App\Models\Appointment;
use App\Models\Medicine;
use App\Models\Event;
use App\Models\User;
use Inertia\Inertia;

class StudentController extends Controller
{
    // ==================== APPOINTMENTS ====================

    public function appointments()
    {
        $myAppointments = Appointment::where('user_id', auth()->id())
            ->latest()
            ->paginate(10);

        return Inertia::render('User/Appointments', [
            'appointments' => $myAppointments,
        ]);
    }

    /**
     * GET /student/booked-slots?date=YYYY-MM-DD
     * Used by frontend to disable booked times.
     */
    public function getBookedSlots(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
        ]);

        // ✅ IMPORTANT: match Admin side statuses (Title Case)
        $booked = Appointment::whereDate('appointment_date', $request->date)
            ->whereIn('status', ['Pending', 'Approved'])
            ->pluck('appointment_time')
            ->values();

        return response()->json([
            'date' => $request->date,
            'booked_slots' => $booked,
        ]);
    }

    public function bookAppointment(Request $request)
    {
        $request->validate([
            'appointment_type' => 'required|string|max:255',
            'appointment_date' => 'required|date|after_or_equal:today',
            'appointment_time' => 'required|string|max:20',
            'notes'            => 'nullable|string|max:500',
        ]);

        // ✅ Prevent double booking (same user, same date/time)
        $exists = Appointment::where('user_id', auth()->id())
            ->whereDate('appointment_date', $request->appointment_date)
            ->where('appointment_time', $request->appointment_time)
            ->whereIn('status', ['Pending', 'Approved'])
            ->exists();

        if ($exists) {
            return back()->with('error', 'You already have an appointment on that slot.');
        }

        // ✅ Optional: limit total bookings per slot (globally)
        $maxBookingsPerSlot = 1;

        $slotCount = Appointment::whereDate('appointment_date', $request->appointment_date)
            ->where('appointment_time', $request->appointment_time)
            ->whereIn('status', ['Pending', 'Approved'])
            ->count();

        if ($slotCount >= $maxBookingsPerSlot) {
            return back()->with('error', 'Sorry, this slot is no longer available.');
        }

        // ✅ SAVE appointment with consistent status
        $appt = Appointment::create([
            'user_id'          => auth()->id(),
            'appointment_type' => $request->appointment_type,
            'appointment_date' => $request->appointment_date,
            'appointment_time' => $request->appointment_time,
            'status'           => 'Pending', // ✅ FIX (was "pending")
            'notes'            => $request->notes,
        ]);

        // 🔔 Notify all Admins & Super Admins
        $user = auth()->user();
        $date = Carbon::parse($request->appointment_date)->format('M d, Y');
        $time = Carbon::parse($request->appointment_time)->format('h:i A');

        $admins = User::whereIn('role', ['Admin', 'Super Admin'])->get();

        foreach ($admins as $admin) {
            DB::table('notifications')->insert([
                'user_id'    => $admin->id,
                'title'      => 'New Appointment Request 📅',
                'message'    => "{$user->name} requested a {$request->appointment_type} appointment on {$date} at {$time}.",
                'type'       => 'info',
                'link'       => '/admin/appointments',
                'is_read'    => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return back()->with('success', 'Appointment booked! Please wait for confirmation.');
    }

    public function cancelAppointment($id)
    {
        $appointment = Appointment::where('user_id', auth()->id())->findOrFail($id);

        // ✅ Allow cancel for Pending/Approved
        if (!in_array($appointment->status, ['Pending', 'Approved'], true)) {
            return back()->with('error', 'This appointment cannot be cancelled.');
        }

        $appointment->update(['status' => 'Cancelled']); // ✅ consistent with Admin tabs

        // 🔔 Notify all Admins & Super Admins
        $user = auth()->user();
        $date = Carbon::parse($appointment->appointment_date)->format('M d, Y');

        $admins = User::whereIn('role', ['Admin', 'Super Admin'])->get();

        foreach ($admins as $admin) {
            DB::table('notifications')->insert([
                'user_id'    => $admin->id,
                'title'      => 'Appointment Cancelled ❌',
                'message'    => "{$user->name} cancelled their {$appointment->appointment_type} appointment on {$date}.",
                'type'       => 'warning',
                'link'       => '/admin/appointments',
                'is_read'    => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return back()->with('success', 'Appointment cancelled successfully.');
    }

    // ==================== MEDICINES ====================

    public function medicines(Request $request)
    {
        $query = Medicine::query();

        // ✅ IMPORTANT: sa AdminController mo quantity/status ang gamit
        // so dito dapat quantity din, hindi stock
        if ($request->boolean('available_only')) {
            $query->where('quantity', '>', 0);
        }

        if ($request->filled('q')) {
            $query->where('name', 'like', '%' . $request->q . '%');
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        $medicines = $query
            ->orderBy('category')
            ->orderBy('name')
            ->paginate(12)
            ->withQueryString();

        $categories = Medicine::query()
            ->select('category')
            ->whereNotNull('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category');

        return Inertia::render('User/Medicines', [
            'medicines' => $medicines,
            'categories' => $categories,
            'filters' => $request->only('q', 'category', 'available_only'),
        ]);
    }

    // ==================== SYMPTOM CHECKER ====================

    public function symptomChecker()
    {
        return Inertia::render('User/SymptomChecker');
    }

    public function analyzeSymptoms(Request $request)
    {
        $data = $request->validate([
            'symptoms' => 'required|string|min:3|max:2000',
        ]);

        $text = strtolower($data['symptoms']);

        $hit = function (array $keywords) use ($text) {
            $score = 0;
            foreach ($keywords as $k) {
                if (str_contains($text, $k)) $score++;
            }
            return $score;
        };

        $profiles = [
            [
                'key' => 'cold_flu',
                'name' => 'Common cold / Flu (Sipon/Trangkaso)',
                'keywords' => ['fever','lagnat','ubo','cough','sipon','runny nose','baradong ilong','sore throat','masakit lalamunan','body ache','pananakit ng katawan'],
                'otc' => ['Paracetamol (for fever/body ache)', 'Lozenges (for sore throat)'],
                'home' => ['Hydrate (tubig/sabaw), rest', 'Warm tea, gargle warm salt water'],
                'urgent' => ['Hirap huminga', 'Chest pain', 'Fever ≥ 39°C o >3 days'],
            ],
            [
                'key' => 'allergy',
                'name' => 'Allergy / Allergic rhinitis',
                'keywords' => ['bahing','sneeze','itch','makati','allergy','allergic','runny nose','sipon','watery eyes','luha','pantal','rash'],
                'otc' => ['Cetirizine / Loratadine (if available)'],
                'home' => ['Avoid triggers (alikabok, usok, strong perfume)', 'Wash face, change clothes after exposure'],
                'urgent' => ['Pamamaga ng labi/mukha', 'Wheezing / hirap huminga'],
            ],
            [
                'key' => 'gastro',
                'name' => 'Stomach upset / Gastroenteritis (LBM/Tiyan)',
                'keywords' => ['pagtatae','lbm','diarrhea','suka','vomit','nausea','nahihilo','tiyan','stomach','cramps','pananakit ng tiyan'],
                'otc' => ['Oral Rehydration Salts (ORS)'],
                'home' => ['Small sips of water/ORS', 'Bland food (lugaw/toast), avoid oily/spicy'],
                'urgent' => ['May dugo ang dumi/suka', 'No urine / very weak', 'Severe dehydration'],
            ],
            [
                'key' => 'uti_possible',
                'name' => 'Possible UTI (Urinary tract infection)',
                'keywords' => ['mahapdi ihi','burning urination','uti','frequent urination','madalas umihi','lower abdomen','puson','cloudy urine','malabong ihi'],
                'otc' => ['(Usually needs clinic assessment; avoid self-medicating antibiotics)'],
                'home' => ['Hydrate a lot', 'Avoid holding urine (huwag pigilan ihi)'],
                'urgent' => ['Fever + back pain', 'Blood in urine', 'Severe pain'],
            ],
            [
                'key' => 'headache',
                'name' => 'Headache (Tension / dehydration / lack of sleep)',
                'keywords' => ['headache','sakit ng ulo','migraine','light sensitivity','pagod','stress','kulang tulog','dehydration','uhaw'],
                'otc' => ['Paracetamol (if needed)'],
                'home' => ['Drink water, rest eyes, reduce screen time', 'Sleep / quiet room'],
                'urgent' => ['Worst headache of life', 'May pamamanhid/weakness', 'Severe vomiting'],
            ],
        ];

        $scored = [];
        foreach ($profiles as $p) {
            $score = $hit($p['keywords']);
            if ($score > 0) {
                $scored[] = ['score' => $score, 'profile' => $p];
            }
        }

        usort($scored, fn($a, $b) => $b['score'] <=> $a['score']);

        $best = $scored[0]['profile'] ?? null;

        $red = (
            str_contains($text, 'hirap huminga') ||
            str_contains($text, 'difficulty breathing') ||
            str_contains($text, 'chest pain') ||
            str_contains($text, 'pananakit ng dibdib') ||
            str_contains($text, 'nahimatay') ||
            str_contains($text, 'faint') ||
            str_contains($text, 'bleeding') ||
            str_contains($text, 'durugo')
        );

        if (!$best) {
            $message =
                "Clinic Assistant (Local Triage)\n\n" .
                "Your symptoms: {$data['symptoms']}\n\n" .
                "Possible: General symptoms — needs clinic assessment\n" .
                "What to do now: Rest + hydrate + monitor within 24–48 hrs\n\n" .
                "Go to clinic urgently if: hirap huminga / chest pain / fainting / severe dehydration\n\n" .
                "Reminder: Guidance only — please visit the clinic for proper diagnosis.";

            return response()->json(['ok' => true, 'message' => $message]);
        }

        $message = "AI Health Guidance (Clinic Assistant)\n\n";
        $message .= "Your symptoms: {$data['symptoms']}\n\n";
        $message .= "Most likely: {$best['name']}\n\n";

        $message .= "Suggested (if available in clinic):\n";
        foreach ($best['otc'] as $m) $message .= "• {$m}\n";
        $message .= "\n";

        $message .= "Do this now:\n";
        foreach ($best['home'] as $h) $message .= "• {$h}\n";
        $message .= "\n";

        $message .= "Seek urgent help if:\n";
        foreach ($best['urgent'] as $u) $message .= "• {$u}\n";

        if ($red) {
            $message .= "\nMay possible urgent symptom sa input mo. Please go to the clinic ASAP.\n";
        }

        $message .= "\n✅ Reminder: Guidance only — please visit the clinic for proper diagnosis.";

        return response()->json(['ok' => true, 'message' => $message]);
    }

    // ==================== EVENTS ====================

    public function events()
    {
        $upcomingEvents = Event::where('event_date', '>=', today())
            ->orderBy('event_date')
            ->get();

        $pastEvents = Event::where('event_date', '<', today())
            ->orderByDesc('event_date')
            ->take(5)
            ->get();

        return Inertia::render('User/Events', [
            'upcomingEvents' => $upcomingEvents,
            'pastEvents' => $pastEvents,
        ]);
    }
}
