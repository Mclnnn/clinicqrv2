<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ClearanceRecord;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class ClearanceController extends Controller
{
    // ══════════════════════════════════════════════════════════════
    // ADMIN METHODS
    // ══════════════════════════════════════════════════════════════

    /**
     * List all clearance requests (admin).
     * Route: GET /admin/clearances  →  name: admin.clearances
     */
    public function adminIndex(Request $request)
    {
        $status = $request->query('status', 'all');

        $query = ClearanceRecord::with('user')->latest();

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $clearances = $query->paginate(15)->withQueryString();

        return Inertia::render('Admin/Clearances', [
            'clearances' => $clearances,
            'status' => $status,
            'statusOptions' => ['all', 'Pending', 'Approved', 'Rejected'],
        ]);
    }

    /**
     * Approve a clearance request (admin).
     * Route: POST /admin/clearances/{id}/approve  →  name: admin.clearances.approve
     *
     * NOTE: dito ok lang ang {id} sa route kasi Eloquent will use primaryKey = clearance_id
     */
    public function approve(Request $request, $id)
    {
        $clearance = ClearanceRecord::findOrFail($id);

        if ($clearance->status !== 'Pending') {
            return back()->with('error', 'This clearance has already been processed.');
        }

        $clearance->update([
            'status'           => 'Approved',
            'rejection_reason' => null,
            'approved_at'      => now(),
            'approved_by'      => auth()->id(),
            'signed_by'        => auth()->id(),
            'signed_at'        => now(),
        ]);

        return back()->with('success', 'Clearance approved successfully.');
    }

    /**
     * Reject a clearance request (admin).
     * Route: POST /admin/clearances/{id}/reject  →  name: admin.clearances.reject
     */
    public function reject(Request $request, $id)
    {
        $request->validate([
            'rejection_reason' => 'required|string|max:1000',
        ]);

        $clearance = ClearanceRecord::findOrFail($id);

        if ($clearance->status !== 'Pending') {
            return back()->with('error', 'This clearance has already been processed.');
        }

        $clearance->update([
            'status'           => 'Rejected',
            'rejection_reason' => $request->rejection_reason,
            'approved_at'      => null,
            'approved_by'      => null,
        ]);

        return back()->with('success', 'Clearance rejected.');
    }

    // ══════════════════════════════════════════════════════════════
    // USER METHODS
    // ══════════════════════════════════════════════════════════════

    /**
     * Show clearance request form + user's request history.
     * Route: GET /clearance  →  name: user.clearances.index
     */
    public function index()
    {
        $user = auth()->user();

        $myRequests = ClearanceRecord::where('user_id', $user->id)
            ->latest()
            ->get();

        $existingPending = ClearanceRecord::where('user_id', $user->id)
            ->where('status', 'Pending')
            ->exists();

        return Inertia::render('User/Clearance', [
            'myRequests' => $myRequests,
            'existingPending' => $existingPending,
        ]);
    }

    /**
     * Submit a new clearance request (user).
     * Route: POST /clearance  →  name: user.clearances.store
     */
    public function store(Request $request)
    {
        $user = auth()->user();

        if (ClearanceRecord::where('user_id', $user->id)->where('status', 'Pending')->exists()) {
            return back()->with('error', 'You already have a pending clearance request. Please wait for it to be reviewed.');
        }

        $request->validate([
            'contact_number' => 'required|string|max:20',
            'school_year'    => 'required|string|max:20',
            'semester'       => 'required|string|max:50',
            'purpose'        => 'required|string|max:255',
            'purpose_custom' => 'nullable|string|max:255',
            'clearance_type' => 'required|string|max:50',
            'documents.*'    => 'nullable|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:5120',
        ]);

        $purpose = $request->purpose === 'Other'
            ? ($request->purpose_custom ?? 'Other')
            : $request->purpose;

        $documentPaths = [];
        if ($request->hasFile('documents')) {
            foreach ($request->file('documents') as $file) {
                $path = $file->store('clearance-documents/' . $user->id, 'public');
                $documentPaths[] = $path;
            }
        }

        $data = [
            'user_id'        => $user->id,
            'visit_purpose'  => $purpose,
            'purpose'        => $purpose,
            'clearance_type' => $request->clearance_type,
            'status'         => 'Pending',
        ];

        $existingColumns = Schema::getColumnListing('clearance_records');

        $extraFields = [
            'contact_number' => $request->contact_number,
            'school_year'    => $request->school_year,
            'semester'       => $request->semester,
            'documents'      => !empty($documentPaths) ? $documentPaths : null,
        ];

        foreach ($extraFields as $col => $val) {
            if (in_array($col, $existingColumns)) {
                $data[$col] = $val;
            }
        }

        ClearanceRecord::create($data);

        return back()->with('success', 'Your clearance request has been submitted. We will notify you once it has been reviewed.');
    }
}
