<?php

namespace App\Models;

use App\Support\QrUrl;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ClinicQrToken extends Model
{
    protected $fillable = [
        'token',
        'valid_date',
        'expires_at',
        'generated_by',
    ];

    protected $casts = [
        'valid_date' => 'date',
        'expires_at' => 'datetime',
    ];

    // Get or create the persistent clinic token.
    public static function todayToken(int $adminId): self
    {
        $existing = self::latest('id')->first();

        if ($existing) {
            if ($existing->expires_at?->isPast() || !$existing->valid_date?->isToday()) {
                $existing->forceFill([
                    'valid_date' => now()->toDateString(),
                    'expires_at' => Carbon::create(2037, 12, 31, 23, 59, 59),
                    'generated_by' => $existing->generated_by ?: $adminId,
                ])->save();
            }

            return $existing;
        }

        return self::create([
            'token' => Str::uuid(),
            'valid_date' => now()->toDateString(),
            'expires_at' => Carbon::create(2037, 12, 31, 23, 59, 59),
            'generated_by' => $adminId,
        ]);
    }

    // Persistent clinic QR codes do not expire.
    public function isValid(): bool
    {
        return true;
    }

    public function getScanUrlAttribute(): string
    {
        return QrUrl::baseUrl() . '/clinic/checkin/' . $this->token;
    }

    public function generator()
    {
        return $this->belongsTo(User::class, 'generated_by');
    }
}
