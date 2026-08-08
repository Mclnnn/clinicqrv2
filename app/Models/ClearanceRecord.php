<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClearanceRecord extends Model
{
    protected $table = 'clearance_records';

    // ✅ FIX: primary key ng table mo ay clearance_id (based sa tinker output mo)
    protected $primaryKey = 'clearance_id';
    public $incrementing = true;
    protected $keyType = 'int';

    public $timestamps = true;

    protected $fillable = [
        'user_id',
        'contact_number',
        'school_year',
        'semester',
        'purpose',
        'visit_purpose',
        'clearance_type',
        'documents',
        'status',
        'rejection_reason',
        'signed_by',
        'signed_at',
        'approved_at',
        'approved_by',
        'notes',
    ];

    protected $casts = [
        'documents'   => 'array',
        'approved_at' => 'datetime',
        'signed_at'   => 'datetime',
    ];

    // ── Relationships ─────────────────────────────────────────

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function signedBy()
    {
        return $this->belongsTo(User::class, 'signed_by');
    }

    // ── Scopes ────────────────────────────────────────────────

    public function scopePending($q)   { return $q->where('status', 'Pending'); }
    public function scopeApproved($q)  { return $q->where('status', 'Approved'); }
    public function scopeRejected($q)  { return $q->where('status', 'Rejected'); }
}